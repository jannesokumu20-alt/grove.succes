import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;

interface PaymentRequest {
  phoneNumber: string;
  amount: number;
  description: string;
  loanId?: string;
  transactionRef: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }
    
    if (!AT_USERNAME || !AT_API_KEY) {
      return NextResponse.json(
        { error: 'Africa\'s Talking credentials not configured' },
        { status: 500 }
      );
    }

    const body: PaymentRequest = await request.json();
    const { phoneNumber, amount, description, loanId, transactionRef } = body;

    if (!phoneNumber || !amount || !transactionRef) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format phone number to E.164
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    // Send payment request to Africa's Talking
    const paymentResponse = await fetch(
      'https://api.sandbox.africastalking.com/version1/ussd',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'ApiKey': AT_API_KEY,
        },
        body: new URLSearchParams({
          username: AT_USERNAME,
          phoneNumber: formattedPhone,
          sessionId: transactionRef,
          text: `CON Grove Chama Payment\nAmount: KES ${amount}\n${description}\nReply 1 to confirm`,
        }).toString(),
      }
    );

    const responseData = await paymentResponse.json();

    // Log transaction
    const { error: logError } = await supabase.from('mpesa_transactions').insert([
      {
        transaction_ref: transactionRef,
        phone_number: formattedPhone,
        amount: amount,
        status: 'pending',
        description: description,
        loan_id: loanId || null,
        created_at: new Date().toISOString(),
      },
    ]);

    if (logError) {
      console.error('Failed to log transaction:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment initiated',
      transactionRef: transactionRef,
      details: responseData,
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
