import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }
    
    const { chamaId } = await request.json();

    if (!chamaId) {
      return NextResponse.json(
        { error: 'Chama ID is required' },
        { status: 400 }
      );
    }

    if (!AT_USERNAME || !AT_API_KEY) {
      return NextResponse.json(
        { error: 'Africa\'s Talking credentials not configured' },
        { status: 500 }
      );
    }

    // Get chama info
    const { data: chamaData, error: chamaError } = await supabase
      .from('chamas')
      .select('*')
      .eq('id', chamaId)
      .single();

    if (chamaError) {
      return NextResponse.json({ error: 'Chama not found' }, { status: 404 });
    }

    // Get members who haven't contributed this month
    const now = new Date();
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, full_name, phone')
      .eq('chama_id', chamaId)
      .eq('status', 'active');

    if (membersError) {
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    // Get contributions for this month
    const { data: contributions } = await supabase
      .from('contributions')
      .select('member_id')
      .eq('chama_id', chamaId)
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear());

    const contributingMemberIds = new Set(
      contributions?.map((c: any) => c.member_id) || []
    );

    // Filter members who haven't contributed
    const membersToRemind = members?.filter(
      (m: any) => !contributingMemberIds.has(m.id)
    ) || [];

    if (membersToRemind.length === 0) {
      return NextResponse.json({
        message: 'All members have contributed this month',
        sentCount: 0,
      });
    }

    // Send SMS to members via Africa's Talking
    const phoneNumbers = membersToRemind
      .map((m: any) => {
        // Format phone number to E.164
        let phone = m.phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '254' + phone.substring(1);
        }
        if (!phone.startsWith('254')) {
          phone = '254' + phone;
        }
        return phone;
      })
      .join(',');

    const message = `Hi, your KES ${chamaData.contribution_amount} contribution to ${chamaData.name} chama is due this month. Please contribute to stay in good standing with Grove. Thank you!`;

    const response = await fetch('https://api.sandbox.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'ApiKey': AT_API_KEY,
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to: phoneNumbers,
        message: message,
      }).toString(),
    });

    const responseData = await response.json();

    // Log reminder in database
    const { error: logError } = await supabase.from('reminders').insert([
      {
        chama_id: chamaId,
        message: message,
        sent_to_count: membersToRemind.length,
        sent_by: 'system',
        sent_at: new Date().toISOString(),
      },
    ]);

    if (logError) {
      console.error('Failed to log reminder:', logError);
    }

    return NextResponse.json({
      message: 'Reminders sent successfully',
      sentCount: membersToRemind.length,
      details: responseData,
    });
  } catch (error: any) {
    console.error('SMS reminder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
