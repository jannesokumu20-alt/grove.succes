// ============================================
// INTELLIGENT AUTOMATION BACKEND FUNCTIONS
// For Reminders and Fines System
// ============================================

import { supabase } from './supabase'

// ============================================
// AUTOMATION SETTINGS FUNCTIONS
// ============================================

export async function getAutomationSettings(chamaId: string) {
  const { data, error } = await supabase
    .from('automation_settings')
    .select('*')
    .eq('chama_id', chamaId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // 'PGRST116' = no rows returned
  
  // Return defaults if no settings exist
  if (!data) {
    return {
      chama_id: chamaId,
      auto_reminders_enabled: true,
      auto_fines_enabled: true,
      reminder_before_days: 3,
      reminder_on_due: true,
      reminder_after_days: 1,
      fine_type: 'fixed',
      fine_amount: 500,
      fine_percentage: 5,
      max_reminders_per_contribution: 3,
    }
  }
  
  return data
}

export async function updateAutomationSettings(chamaId: string, settings: any) {
  const { data, error } = await supabase
    .from('automation_settings')
    .upsert({
      chama_id: chamaId,
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq('chama_id', chamaId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// CONTRIBUTION TRACKING FUNCTIONS
// ============================================

export async function getContributionTracking(chamaId: string, memberId?: string) {
  let query = supabase
    .from('contribution_tracking')
    .select('*')
    .eq('chama_id', chamaId)

  if (memberId) {
    query = query.eq('member_id', memberId)
  }

  const { data, error } = await query.order('due_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getOverdueContributions(chamaId: string) {
  const { data, error } = await supabase
    .from('contribution_tracking')
    .select('*')
    .eq('chama_id', chamaId)
    .eq('status', 'overdue')
    .is('overdue_since', null)

  if (error) throw error
  return data || []
}

export async function getPendingContributions(chamaId: string, daysAhead: number = 7) {
  const { data, error } = await supabase
    .from('contribution_tracking')
    .select('*')
    .eq('chama_id', chamaId)
    .in('status', ['pending', 'partial'])
    .lte('due_date', `now() + ${daysAhead} days`)
    .gt('due_date', 'now()')

  if (error) throw error
  return data || []
}

export async function markContributionAsOverdue(trackingId: string) {
  const { data, error } = await supabase
    .from('contribution_tracking')
    .update({
      status: 'overdue',
      overdue_since: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', trackingId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// AUTO REMINDERS FUNCTIONS
// ============================================

export async function createAutoReminder(
  chamaId: string,
  memberId: string,
  trackingId: string,
  reminderType: 'upcoming' | 'due' | 'overdue',
  title: string,
  message: string,
  scheduledDate: string
) {
  const { data, error } = await supabase
    .from('auto_reminders')
    .insert([
      {
        chama_id: chamaId,
        member_id: memberId,
        contribution_tracking_id: trackingId,
        reminder_type: reminderType,
        title,
        message,
        scheduled_date: scheduledDate,
        sent: false,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAutoReminders(chamaId: string, status?: 'pending' | 'sent') {
  let query = supabase
    .from('auto_reminders')
    .select('*, members(name, phone)')
    .eq('chama_id', chamaId)

  if (status === 'pending') {
    query = query.eq('sent', false)
  } else if (status === 'sent') {
    query = query.eq('sent', true)
  }

  const { data, error } = await query.order('scheduled_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPendingAutoReminders(chamaId: string) {
  const { data, error } = await supabase
    .from('auto_reminders')
    .select('*, members(name, phone)')
    .eq('chama_id', chamaId)
    .eq('sent', false)
    .lte('scheduled_date', 'now()')
    .order('scheduled_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function sendAutoReminder(reminderId: string) {
  const { data, error } = await supabase
    .from('auto_reminders')
    .update({
      sent: true,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reminderId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAutoReminder(reminderId: string) {
  const { error } = await supabase
    .from('auto_reminders')
    .delete()
    .eq('id', reminderId)

  if (error) throw error
}

// ============================================
// AUTO FINES FUNCTIONS
// ============================================

export async function createAutoFine(
  chamaId: string,
  memberId: string,
  trackingId: string,
  fineAmount: number,
  calculationMethod: 'fixed' | 'percentage',
  percentageApplied?: number,
  reason: string = 'Automatic fine for overdue contribution'
) {
  // First create the fine record
  const { data: fineData, error: fineError } = await supabase
    .from('fines')
    .insert([
      {
        chama_id: chamaId,
        member_id: memberId,
        reason,
        amount: fineAmount,
        paid: false,
      },
    ])
    .select()
    .single()

  if (fineError) throw fineError

  // Then create the auto fine tracking record
  const { data, error } = await supabase
    .from('auto_fines')
    .insert([
      {
        chama_id: chamaId,
        member_id: memberId,
        contribution_tracking_id: trackingId,
        fine_id: fineData.id,
        base_amount: fineAmount,
        calculated_amount: fineAmount,
        calculation_method: calculationMethod,
        percentage_applied: percentageApplied,
        reason,
        auto_applied: true,
      },
    ])
    .select()
    .single()

  if (error) throw error

  // Update contribution tracking to link the fine
  await supabase
    .from('contribution_tracking')
    .update({
      is_auto_fined: true,
      fine_id: fineData.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', trackingId)

  return { fine: fineData, autoFine: data }
}

export async function getAutoFines(chamaId: string, memberId?: string) {
  let query = supabase
    .from('auto_fines')
    .select('*, fines(*, members(name, phone))')
    .eq('chama_id', chamaId)

  if (memberId) {
    query = query.eq('member_id', memberId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function removeAutoFine(autoFineId: string) {
  // Get the auto fine record
  const { data: autoFine, error: fetchError } = await supabase
    .from('auto_fines')
    .select('fine_id, contribution_tracking_id')
    .eq('id', autoFineId)
    .single()

  if (fetchError) throw fetchError

  // Delete the fine
  await supabase.from('fines').delete().eq('id', autoFine.fine_id)

  // Delete the auto fine record
  await supabase.from('auto_fines').delete().eq('id', autoFineId)

  // Update contribution tracking
  await supabase
    .from('contribution_tracking')
    .update({
      is_auto_fined: false,
      fine_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', autoFine.contribution_tracking_id)
}

// ============================================
// AUTOMATION ORCHESTRATION FUNCTIONS
// ============================================

export async function triggerAutoReminders(chamaId: string) {
  try {
    const settings = await getAutomationSettings(chamaId)
    
    if (!settings.auto_reminders_enabled) {
      console.log('Auto reminders disabled for chama:', chamaId)
      return { success: true, created: 0 }
    }

    // Get all pending contributions
    const contributions = await getPendingContributions(chamaId, settings.reminder_before_days)
    let remindersCreated = 0

    for (const contrib of contributions) {
      // Check if reminder already exists
      const { data: existingReminders } = await supabase
        .from('auto_reminders')
        .select('id')
        .eq('contribution_tracking_id', contrib.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (existingReminders && existingReminders.length >= settings.max_reminders_per_contribution) {
        continue
      }

      // Calculate days until due
      const daysUntilDue = Math.ceil(
        (new Date(contrib.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      let reminderType: 'upcoming' | 'due' | 'overdue' = 'upcoming'
      let shouldCreate = false

      if (daysUntilDue <= 0 && daysUntilDue > -settings.reminder_after_days) {
        reminderType = 'overdue'
        shouldCreate = true
      } else if (daysUntilDue === 0 && settings.reminder_on_due) {
        reminderType = 'due'
        shouldCreate = true
      } else if (daysUntilDue > 0 && daysUntilDue <= settings.reminder_before_days) {
        reminderType = 'upcoming'
        shouldCreate = true
      }

      if (shouldCreate) {
        const messages = {
          upcoming: `Contribution of KES ${contrib.expected_amount} is due on ${contrib.due_date}. Please ensure timely payment.`,
          due: `Your contribution of KES ${contrib.expected_amount} is due TODAY. Please submit your payment.`,
          overdue: `Your contribution of KES ${contrib.expected_amount} was due on ${contrib.due_date} and is now overdue. Please settle immediately.`,
        }

        await createAutoReminder(
          chamaId,
          contrib.member_id,
          contrib.id,
          reminderType,
          `${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} Contribution Reminder`,
          messages[reminderType],
          new Date().toISOString()
        )

        remindersCreated++
      }
    }

    return { success: true, created: remindersCreated }
  } catch (error: any) {
    console.error('Error triggering auto reminders:', error)
    throw error
  }
}

export async function triggerAutoFines(chamaId: string) {
  try {
    const settings = await getAutomationSettings(chamaId)
    
    if (!settings.auto_fines_enabled) {
      console.log('Auto fines disabled for chama:', chamaId)
      return { success: true, created: 0 }
    }

    // Get all overdue contributions that aren't already fined
    const { data: overdueContribs, error } = await supabase
      .from('contribution_tracking')
      .select('*')
      .eq('chama_id', chamaId)
      .eq('status', 'overdue')
      .eq('is_auto_fined', false)
      .lt('due_date', 'now()')

    if (error) throw error

    let finesCreated = 0

    for (const contrib of overdueContribs || []) {
      const fineAmount =
        settings.fine_type === 'percentage'
          ? (contrib.expected_amount * settings.fine_percentage) / 100
          : settings.fine_amount

      await createAutoFine(
        chamaId,
        contrib.member_id,
        contrib.id,
        fineAmount,
        settings.fine_type as any,
        settings.fine_type === 'percentage' ? settings.fine_percentage : undefined,
        `Auto-fine: Overdue contribution for ${contrib.month}/${contrib.year}`
      )

      finesCreated++
    }

    return { success: true, created: finesCreated }
  } catch (error: any) {
    console.error('Error triggering auto fines:', error)
    throw error
  }
}

export async function getContributionStatus(chamaId: string, memberId: string) {
  const { data, error } = await supabase
    .from('contribution_tracking')
    .select('*, auto_reminders(reminder_type, sent), auto_fines(fine_id)')
    .eq('chama_id', chamaId)
    .eq('member_id', memberId)
    .order('due_date', { ascending: false })

  if (error) throw error
  
  return data || []
}

export async function getMemberFineBreakdown(chamaId: string, memberId: string) {
  const { data, error } = await supabase
    .from('auto_fines')
    .select('*, fines(amount, paid, reason)')
    .eq('chama_id', chamaId)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const breakdown = {
    totalFines: 0,
    paidFines: 0,
    unpaidFines: 0,
    fines: data || [],
  }

  for (const fine of breakdown.fines) {
    const amount = fine.fines?.amount || 0
    breakdown.totalFines += amount
    if (fine.fines?.paid) {
      breakdown.paidFines += amount
    } else {
      breakdown.unpaidFines += amount
    }
  }

  return breakdown
}
