import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface CallbackData {
  transactionId: string;
  transactionRef: string;
  status: 'Success' | 'Failed';
  amount: number;
  phoneNumber: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }
    
    const body: CallbackData = await request.json();
    const { transactionRef, status, amount } = body;

    if (!transactionRef) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      );
    }

    // Get existing transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('mpesa_code', transactionRef)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('mpesa_transactions')
      .update({
        status: status === 'Success' ? 'success' : 'failed',
      })
      .eq('mpesa_code', transactionRef);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    // If payment successful and it's a loan repayment, update loan
    if (status === 'Success' && transaction.loan_id) {
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', transaction.loan_id)
        .single();

      if (!loanError && loan && transaction.member_id) {
        const newBalance = Math.max(0, loan.balance - amount);
        const isFullyRepaid = newBalance <= 0;

        await supabase
          .from('loans')
          .update({
            balance: newBalance,
            status: isFullyRepaid ? 'paid' : 'approved',
          })
          .eq('id', transaction.loan_id);

        // Record repayment
        await supabase.from('loan_repayments').insert([
          {
            loan_id: transaction.loan_id,
            member_id: transaction.member_id,
            amount: amount,
            paid_at: new Date().toISOString(),
            recorded_by: transaction.member_id,
          },
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment ${status === 'Success' ? 'processed' : 'failed'} successfully`,
      transactionRef: transactionRef,
    });
  } catch (error: any) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process callback' },
      { status: 500 }
    );
  }
}
