import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

const { width: W } = Dimensions.get('window');

type InterestType = 'fixed' | 'variable';
type Step = 'calculator' | 'schedule' | 'eligibility' | 'documents' | 'review' | 'submitted';

const TERMS = [6, 12, 24, 36];

const FIXED_RATES: Record<number, number> = { 6: 0.058, 12: 0.069, 24: 0.079, 36: 0.089 };
const VARIABLE_BASE_RATE = 0.055;

const PURPOSE_OPTIONS = [
  { id: 'personal', label: 'Personal Expenses', icon: 'person' },
  { id: 'home', label: 'Home Improvement', icon: 'home' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'business', label: 'Business', icon: 'business' },
  { id: 'medical', label: 'Medical', icon: 'local-hospital' },
  { id: 'vehicle', label: 'Vehicle', icon: 'directions-car' },
];

const EMPLOYMENT_OPTIONS = ['Employed (Full-time)', 'Self-Employed', 'Contract/Freelance', 'Retired', 'Student'];

function amortizationSchedule(principal: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 12;
  const payment = monthlyRate === 0
    ? principal / months
    : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

  let balance = principal;
  return Array.from({ length: months }, (_, i) => {
    const interest = balance * monthlyRate;
    const principalPaid = payment - interest;
    balance = Math.max(0, balance - principalPaid);
    return { month: i + 1, payment, principalPaid, interest, balance };
  });
}

export default function LoanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors } = useTheme();

  const [step, setStep] = useState<Step>('calculator');
  const [loanAmount, setLoanAmount] = useState('10000');
  const [term, setTerm] = useState(12);
  const [interestType, setInterestType] = useState<InterestType>('fixed');
  const [showAllSchedule, setShowAllSchedule] = useState(false);

  // Eligibility form fields
  const [fullName, setFullName] = useState('');
  const [employment, setEmployment] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [creditScore, setCreditScore] = useState('740');
  const [purpose, setPurpose] = useState('');

  const principal = parseFloat(loanAmount) || 0;
  const annualRate = interestType === 'fixed'
    ? FIXED_RATES[term] ?? 0.079
    : VARIABLE_BASE_RATE + (term > 12 ? 0.01 : 0);

  const schedule = useMemo(() => amortizationSchedule(principal, annualRate, term), [principal, annualRate, term]);
  const monthlyPayment = schedule[0]?.payment ?? 0;
  const totalPayment = monthlyPayment * term;
  const totalInterest = totalPayment - principal;
  const monthlyRate = annualRate / 12;

  const scheduleToShow = showAllSchedule ? schedule : schedule.slice(0, 6);

  const handleApply = useCallback(() => {
    if (!fullName.trim()) { showAlert('Required', 'Enter your full name.'); return; }
    if (!employment) { showAlert('Required', 'Select your employment status.'); return; }
    if (!annualIncome || parseFloat(annualIncome) <= 0) { showAlert('Required', 'Enter your annual income.'); return; }
    if (!purpose) { showAlert('Required', 'Select a loan purpose.'); return; }
    setStep('documents');
  }, [fullName, employment, annualIncome, purpose, showAlert]);

  const styles = makeStyles(colors);

  const STEPS: Step[] = ['calculator', 'schedule', 'eligibility', 'documents', 'review'];
  const stepIdx = STEPS.indexOf(step);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {step !== 'submitted' && (
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              const idx = STEPS.indexOf(step);
              if (idx > 0) setStep(STEPS[idx - 1]);
              else router.back();
            }}
            hitSlop={12}
          >
            <MaterialIcons name={step === 'calculator' ? 'close' : 'arrow-back'} size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {step === 'calculator' ? 'Loan Calculator' :
             step === 'schedule' ? 'Amortization' :
             step === 'eligibility' ? 'Eligibility Check' :
             step === 'documents' ? 'Documents' :
             'Review Application'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      {/* Progress */}
      {step !== 'submitted' && (
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, i <= stepIdx && styles.stepDotActive]} />
              {i < STEPS.length - 1 && <View style={[styles.stepLine, i < stepIdx && styles.stepLineDone]} />}
            </React.Fragment>
          ))}
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* ── STEP 1: Calculator ── */}
          {step === 'calculator' && (
            <>
              <Text style={styles.stepTitle}>Loan Calculator</Text>

              {/* Amount Input */}
              <View style={styles.amountCard}>
                <Text style={styles.cardLabel}>Loan Amount</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amountSymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={loanAmount}
                    onChangeText={setLoanAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    accessibilityLabel="Loan amount"
                  />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
                  {['5000', '10000', '25000', '50000', '100000'].map(v => (
                    <Pressable
                      key={v}
                      style={[styles.quickChip, loanAmount === v && styles.quickChipActive]}
                      onPress={() => setLoanAmount(v)}
                    >
                      <Text style={[styles.quickChipText, loanAmount === v && styles.quickChipTextActive]}>
                        ${parseInt(v).toLocaleString()}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Term Selector */}
              <Text style={styles.cardLabel}>Loan Term</Text>
              <View style={styles.termRow}>
                {TERMS.map(t => (
                  <Pressable
                    key={t}
                    style={[styles.termBtn, term === t && styles.termBtnActive]}
                    onPress={() => setTerm(t)}
                  >
                    <Text style={[styles.termText, term === t && styles.termTextActive]}>{t}</Text>
                    <Text style={[styles.termSub, term === t && { color: colors.textOnDark + 'AA' }]}>mo</Text>
                  </Pressable>
                ))}
              </View>

              {/* Interest Type */}
              <Text style={styles.cardLabel}>Interest Rate Type</Text>
              <View style={styles.interestToggle}>
                {(['fixed', 'variable'] as InterestType[]).map(type => (
                  <Pressable
                    key={type}
                    style={[styles.interestBtn, interestType === type && styles.interestBtnActive]}
                    onPress={() => setInterestType(type)}
                  >
                    <MaterialIcons
                      name={type === 'fixed' ? 'lock' : 'trending-up'}
                      size={16}
                      color={interestType === type ? colors.textOnDark : colors.textSecondary}
                    />
                    <Text style={[styles.interestBtnText, interestType === type && { color: colors.textOnDark }]}>
                      {type === 'fixed' ? `Fixed ${(FIXED_RATES[term] * 100).toFixed(1)}%` : `Variable ~${(VARIABLE_BASE_RATE * 100).toFixed(1)}%+`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {interestType === 'variable' && (
                <View style={styles.variableNote}>
                  <MaterialIcons name="info-outline" size={14} color={colors.warning} />
                  <Text style={styles.variableNoteText}>Variable rates may change monthly based on market index.</Text>
                </View>
              )}

              {/* Summary Card */}
              {principal > 0 && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryTop}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryBig}>${monthlyPayment.toFixed(2)}</Text>
                      <Text style={styles.summaryItemLabel}>Monthly Payment</Text>
                    </View>
                    <View style={[styles.summarySep, { backgroundColor: colors.divider }]} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryBig}>{(annualRate * 100).toFixed(1)}%</Text>
                      <Text style={styles.summaryItemLabel}>APR</Text>
                    </View>
                    <View style={[styles.summarySep, { backgroundColor: colors.divider }]} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryBig}>{term}mo</Text>
                      <Text style={styles.summaryItemLabel}>Term</Text>
                    </View>
                  </View>

                  <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />

                  <View style={styles.summaryDetails}>
                    {[
                      { label: 'Principal', value: `$${principal.toLocaleString()}` },
                      { label: 'Total Interest', value: `$${totalInterest.toFixed(2)}`, color: colors.error },
                      { label: 'Total Repayment', value: `$${totalPayment.toFixed(2)}`, bold: true },
                    ].map(row => (
                      <View key={row.label} style={styles.summaryDetailRow}>
                        <Text style={styles.summaryDetailLabel}>{row.label}</Text>
                        <Text style={[styles.summaryDetailValue, row.color ? { color: row.color } : {}, row.bold ? { fontWeight: FontWeight.bold, color: colors.textPrimary } : {}]}>
                          {row.value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Visual cost bar */}
                  <View style={styles.costBar}>
                    <View style={[styles.costBarPrincipal, { flex: principal, backgroundColor: colors.primary }]} />
                    <View style={[styles.costBarInterest, { flex: totalInterest, backgroundColor: colors.error + 'BB' }]} />
                  </View>
                  <View style={styles.costBarLegend}>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Principal</Text></View>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.error + 'BB' }]} /><Text style={styles.legendText}>Interest</Text></View>
                  </View>
                </View>
              )}

              <Pressable
                style={[styles.primaryBtn, !principal && { opacity: 0.5 }]}
                onPress={() => principal > 0 ? setStep('schedule') : showAlert('Enter Amount', 'Please enter a loan amount.')}
              >
                <Text style={styles.primaryBtnText}>View Amortization Schedule</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.textOnDark} />
              </Pressable>
            </>
          )}

          {/* ── STEP 2: Amortization ── */}
          {step === 'schedule' && (
            <>
              <Text style={styles.stepTitle}>Payment Schedule</Text>

              <View style={styles.scheduleHeader}>
                <View style={styles.scheduleHeaderItem}>
                  <Text style={styles.scheduleHeaderValue}>${monthlyPayment.toFixed(2)}</Text>
                  <Text style={styles.scheduleHeaderLabel}>Monthly</Text>
                </View>
                <View style={[styles.scheduleHeaderSep, { backgroundColor: colors.divider }]} />
                <View style={styles.scheduleHeaderItem}>
                  <Text style={styles.scheduleHeaderValue}>${totalInterest.toFixed(2)}</Text>
                  <Text style={styles.scheduleHeaderLabel}>Total Interest</Text>
                </View>
                <View style={[styles.scheduleHeaderSep, { backgroundColor: colors.divider }]} />
                <View style={styles.scheduleHeaderItem}>
                  <Text style={styles.scheduleHeaderValue}>${totalPayment.toFixed(2)}</Text>
                  <Text style={styles.scheduleHeaderLabel}>Total Cost</Text>
                </View>
              </View>

              {/* Table */}
              <View style={styles.table}>
                <View style={[styles.tableHeader, { backgroundColor: colors.primary }]}>
                  {['Mo.', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                    <Text key={h} style={styles.tableHeaderText}>{h}</Text>
                  ))}
                </View>
                {scheduleToShow.map((row, i) => (
                  <View key={row.month} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? colors.surface : colors.background }]}>
                    <Text style={styles.tableCell}>{row.month}</Text>
                    <Text style={styles.tableCell}>${row.payment.toFixed(0)}</Text>
                    <Text style={[styles.tableCell, { color: colors.primary }]}>${row.principalPaid.toFixed(0)}</Text>
                    <Text style={[styles.tableCell, { color: colors.error }]}>${row.interest.toFixed(0)}</Text>
                    <Text style={styles.tableCell}>${row.balance.toFixed(0)}</Text>
                  </View>
                ))}
              </View>

              {schedule.length > 6 && (
                <Pressable style={styles.showMoreBtn} onPress={() => setShowAllSchedule(v => !v)}>
                  <Text style={styles.showMoreText}>
                    {showAllSchedule ? 'Show Less' : `Show All ${schedule.length} Months`}
                  </Text>
                  <MaterialIcons name={showAllSchedule ? 'expand-less' : 'expand-more'} size={18} color={colors.primary} />
                </Pressable>
              )}

              <Pressable style={styles.primaryBtn} onPress={() => setStep('eligibility')}>
                <Text style={styles.primaryBtnText}>Apply for This Loan</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.textOnDark} />
              </Pressable>
            </>
          )}

          {/* ── STEP 3: Eligibility ── */}
          {step === 'eligibility' && (
            <>
              <Text style={styles.stepTitle}>Eligibility Check</Text>
              <Text style={styles.stepSub}>Quick pre-qualification — no credit impact</Text>

              {/* Purpose */}
              <Text style={styles.inputLabel}>Loan Purpose</Text>
              <View style={styles.purposeGrid}>
                {PURPOSE_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.id}
                    style={[styles.purposeCard, purpose === opt.id && styles.purposeCardActive]}
                    onPress={() => setPurpose(opt.id)}
                  >
                    <MaterialIcons name={opt.icon as any} size={20} color={purpose === opt.id ? colors.textOnDark : colors.textSecondary} />
                    <Text style={[styles.purposeLabel, purpose === opt.id && { color: colors.textOnDark }]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              {[
                { label: 'Full Name *', value: fullName, onChange: setFullName, placeholder: 'As on government ID', icon: 'person' },
                { label: 'Annual Income (USD) *', value: annualIncome, onChange: setAnnualIncome, placeholder: 'Before taxes', icon: 'attach-money', numeric: true },
                { label: 'Estimated Credit Score', value: creditScore, onChange: setCreditScore, placeholder: '300–850', icon: 'score', numeric: true },
              ].map(field => (
                <View key={field.label}>
                  <Text style={styles.inputLabel}>{field.label}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialIcons name={field.icon as any} size={18} color={colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.textMuted}
                      keyboardType={field.numeric ? 'numeric' : 'default'}
                      accessibilityLabel={field.label}
                    />
                  </View>
                </View>
              ))}

              {/* Employment */}
              <Text style={styles.inputLabel}>Employment Status *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                {EMPLOYMENT_OPTIONS.map(e => (
                  <Pressable
                    key={e}
                    style={[styles.quickChip, employment === e && styles.quickChipActive, { marginRight: Spacing.sm }]}
                    onPress={() => setEmployment(e)}
                  >
                    <Text style={[styles.quickChipText, employment === e && styles.quickChipTextActive]}>{e}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Pre-qualification indicators */}
              {creditScore && annualIncome && (
                <View style={styles.preQualCard}>
                  <Text style={styles.preQualTitle}>Pre-Qualification Estimate</Text>
                  {[
                    { label: 'Approval Odds', value: parseInt(creditScore) >= 700 ? 'High' : parseInt(creditScore) >= 620 ? 'Medium' : 'Low', color: parseInt(creditScore) >= 700 ? colors.success : parseInt(creditScore) >= 620 ? colors.warning : colors.error },
                    { label: 'Estimated APR', value: `${(annualRate * 100).toFixed(1)}%–${(annualRate * 100 + 2).toFixed(1)}%`, color: colors.primary },
                    { label: 'Max Loan Amount', value: `$${(parseFloat(annualIncome || '0') * 0.4).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: colors.textPrimary },
                  ].map((item, i, arr) => (
                    <React.Fragment key={item.label}>
                      <View style={styles.preQualRow}>
                        <Text style={styles.preQualLabel}>{item.label}</Text>
                        <Text style={[styles.preQualValue, { color: item.color }]}>{item.value}</Text>
                      </View>
                      {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                    </React.Fragment>
                  ))}
                </View>
              )}

              <Pressable style={styles.primaryBtn} onPress={handleApply}>
                <Text style={styles.primaryBtnText}>Continue to Documents</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.textOnDark} />
              </Pressable>
            </>
          )}

          {/* ── STEP 4: Documents ── */}
          {step === 'documents' && (
            <>
              <Text style={styles.stepTitle}>Required Documents</Text>
              <Text style={styles.stepSub}>Please have these ready to complete your application</Text>

              {[
                { title: 'Government ID', sub: 'Passport, Driver License, or National ID', icon: 'badge', status: 'Verified via KYC' },
                { title: 'Proof of Income', sub: '3 months pay stubs or bank statements', icon: 'receipt-long', status: 'Upload required' },
                { title: 'Bank Statements', sub: 'Last 3 months from primary account', icon: 'account-balance', status: 'Upload required' },
                { title: 'Employment Letter', sub: 'For salaried employees', icon: 'work', status: 'Optional' },
              ].map((doc, i) => (
                <Pressable
                  key={doc.title}
                  style={styles.docRow}
                  onPress={() => showAlert(doc.title, doc.status === 'Verified via KYC' ? 'Already verified through your KYC submission.' : `Upload your ${doc.title} to continue.`)}
                >
                  <View style={[styles.docIcon, { backgroundColor: doc.status === 'Verified via KYC' ? colors.successBg : colors.background }]}>
                    <MaterialIcons name={doc.icon as any} size={22} color={doc.status === 'Verified via KYC' ? colors.success : colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <Text style={styles.docSub}>{doc.sub}</Text>
                  </View>
                  <View style={[styles.docStatus, {
                    backgroundColor: doc.status === 'Verified via KYC' ? colors.successBg : doc.status === 'Optional' ? colors.background : colors.warningBg
                  }]}>
                    <Text style={[styles.docStatusText, {
                      color: doc.status === 'Verified via KYC' ? colors.success : doc.status === 'Optional' ? colors.textMuted : colors.warning
                    }]}>{doc.status}</Text>
                  </View>
                </Pressable>
              ))}

              <Pressable style={styles.primaryBtn} onPress={() => setStep('review')}>
                <Text style={styles.primaryBtnText}>Review Application</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.textOnDark} />
              </Pressable>
            </>
          )}

          {/* ── STEP 5: Review & Submit ── */}
          {step === 'review' && (
            <>
              <Text style={styles.stepTitle}>Review Application</Text>

              <View style={styles.reviewCard}>
                <Text style={styles.reviewSection}>Loan Details</Text>
                {[
                  { label: 'Amount', value: `$${parseInt(loanAmount).toLocaleString()}` },
                  { label: 'Term', value: `${term} months` },
                  { label: 'Interest Type', value: interestType === 'fixed' ? `Fixed ${(annualRate * 100).toFixed(1)}%` : `Variable ~${(annualRate * 100).toFixed(1)}%` },
                  { label: 'Monthly Payment', value: `$${monthlyPayment.toFixed(2)}` },
                  { label: 'Total Interest', value: `$${totalInterest.toFixed(2)}` },
                  { label: 'Total Repayment', value: `$${totalPayment.toFixed(2)}`, bold: true },
                ].map((row, i, arr) => (
                  <React.Fragment key={row.label}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>{row.label}</Text>
                      <Text style={[styles.reviewValue, row.bold && { fontWeight: FontWeight.bold, color: colors.primary }]}>
                        {row.value}
                      </Text>
                    </View>
                    {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                  </React.Fragment>
                ))}
              </View>

              <View style={styles.reviewCard}>
                <Text style={styles.reviewSection}>Applicant</Text>
                {[
                  { label: 'Name', value: fullName },
                  { label: 'Employment', value: employment },
                  { label: 'Annual Income', value: `$${parseInt(annualIncome || '0').toLocaleString()}` },
                  { label: 'Credit Score', value: creditScore },
                  { label: 'Purpose', value: PURPOSE_OPTIONS.find(p => p.id === purpose)?.label ?? purpose },
                ].map((row, i, arr) => (
                  <React.Fragment key={row.label}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>{row.label}</Text>
                      <Text style={styles.reviewValue}>{row.value}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                  </React.Fragment>
                ))}
              </View>

              <View style={styles.disclaimer}>
                <MaterialIcons name="info-outline" size={14} color={colors.textMuted} />
                <Text style={styles.disclaimerText}>
                  Final approval, APR, and terms subject to credit check and verification. This is a pre-qualification estimate only.
                </Text>
              </View>

              <Pressable style={styles.primaryBtn} onPress={() => setStep('submitted')}>
                <MaterialIcons name="send" size={20} color={colors.textOnDark} />
                <Text style={styles.primaryBtnText}>Submit Application</Text>
              </Pressable>
            </>
          )}

          {/* ── SUBMITTED ── */}
          {step === 'submitted' && (
            <View style={styles.successWrap}>
              <View style={styles.successCircle}>
                <MaterialIcons name="check-circle" size={52} color={colors.textOnDark} />
              </View>
              <Text style={styles.successTitle}>Application Submitted!</Text>
              <Text style={styles.successSub}>
                Your loan application for ${parseInt(loanAmount).toLocaleString()} has been received. We will notify you within 24–48 hours.
              </Text>

              <View style={styles.refCard}>
                <Text style={styles.refLabel}>Application Reference</Text>
                <Text style={styles.refValue}>LOAN-{Date.now().toString().slice(-8)}</Text>
                <View style={styles.refDetails}>
                  {[
                    { label: 'Amount', value: `$${parseInt(loanAmount).toLocaleString()}` },
                    { label: 'Decision', value: 'Within 48 hours' },
                    { label: 'Status', value: 'Under Review' },
                  ].map(r => (
                    <View key={r.label} style={styles.refRow}>
                      <Text style={styles.refRowLabel}>{r.label}</Text>
                      <Text style={[styles.refRowValue, r.label === 'Status' && { color: colors.warning }]}>{r.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
                <Text style={styles.primaryBtnText}>Back to Accounts</Text>
              </Pressable>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof import('../contexts/ThemeContext').useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
    },
    headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: colors.textPrimary },
    stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.base },
    stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
    stepDotActive: { backgroundColor: colors.primary },
    stepLine: { flex: 1, height: 2, backgroundColor: colors.border },
    stepLineDone: { backgroundColor: colors.primary },
    content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl },
    stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.xs },
    stepSub: { fontSize: FontSize.sm, color: colors.textMuted, marginBottom: Spacing.base },
    cardLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },
    amountCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
      marginBottom: Spacing.sm, ...Shadow.sm,
    },
    amountRow: { flexDirection: 'row', alignItems: 'center' },
    amountSymbol: { fontSize: 38, fontWeight: FontWeight.bold, color: colors.textPrimary, marginRight: 4 },
    amountInput: { flex: 1, fontSize: 38, fontWeight: FontWeight.bold, color: colors.textPrimary, includeFontPadding: false },
    quickChip: {
      paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    quickChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    quickChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    quickChipTextActive: { color: colors.textOnDark },
    termRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
    termBtn: {
      flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
      backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: colors.border,
    },
    termBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    termText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: colors.textPrimary },
    termTextActive: { color: colors.textOnDark },
    termSub: { fontSize: FontSize.xs, color: colors.textMuted },
    interestToggle: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
    interestBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: Spacing.md, backgroundColor: colors.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: colors.border,
    },
    interestBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    interestBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    variableNote: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      backgroundColor: colors.warningBg, borderRadius: Radius.lg, padding: Spacing.sm,
      marginBottom: Spacing.sm, borderWidth: 1, borderColor: colors.warning + '44',
    },
    variableNoteText: { fontSize: FontSize.xs, color: colors.textSecondary, flex: 1 },
    summaryCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xxl, padding: Spacing.base,
      marginTop: Spacing.base, marginBottom: Spacing.md, ...Shadow.md,
    },
    summaryTop: { flexDirection: 'row', paddingBottom: Spacing.md },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryBig: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: colors.textPrimary },
    summaryItemLabel: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    summarySep: { width: 1, marginVertical: 4 },
    summaryDivider: { height: 1, marginBottom: Spacing.md },
    summaryDetails: {},
    summaryDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
    summaryDetailLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    summaryDetailValue: { fontSize: FontSize.sm, color: colors.textSecondary },
    costBar: { height: 8, borderRadius: Radius.pill, overflow: 'hidden', flexDirection: 'row', marginTop: Spacing.md },
    costBarPrincipal: { height: '100%' },
    costBarInterest: { height: '100%' },
    costBarLegend: { flexDirection: 'row', gap: Spacing.base, marginTop: Spacing.sm },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: FontSize.xs, color: colors.textMuted },
    scheduleHeader: {
      flexDirection: 'row', backgroundColor: colors.surface, borderRadius: Radius.xl,
      padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.sm,
    },
    scheduleHeaderItem: { flex: 1, alignItems: 'center' },
    scheduleHeaderValue: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: colors.textPrimary },
    scheduleHeaderLabel: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    scheduleHeaderSep: { width: 1, marginVertical: 4 },
    table: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md, ...Shadow.sm },
    tableHeader: { flexDirection: 'row', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
    tableHeaderText: { flex: 1, fontSize: 10, fontWeight: FontWeight.bold, color: colors.textOnDark, textAlign: 'center' },
    tableRow: { flexDirection: 'row', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
    tableCell: { flex: 1, fontSize: FontSize.xs, color: colors.textSecondary, textAlign: 'center' },
    showMoreBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
      paddingVertical: Spacing.md, marginBottom: Spacing.md,
    },
    showMoreText: { fontSize: FontSize.sm, color: colors.primary, fontWeight: FontWeight.semibold },
    inputLabel: {
      fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary,
      marginBottom: Spacing.xs, marginTop: Spacing.md,
    },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.border,
    },
    input: { flex: 1, fontSize: FontSize.base, color: colors.textPrimary, includeFontPadding: false },
    purposeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
    purposeCard: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      backgroundColor: colors.surface, borderRadius: Radius.pill,
      borderWidth: 1.5, borderColor: colors.border,
    },
    purposeCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    purposeLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: colors.textSecondary },
    preQualCard: {
      backgroundColor: colors.cardMint, borderRadius: Radius.xl, padding: Spacing.base,
      marginTop: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    preQualTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.sm },
    preQualRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
    preQualLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    preQualValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    divider: { height: 1 },
    docRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    docIcon: { width: 48, height: 48, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    docTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    docSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    docStatus: { borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
    docStatusText: { fontSize: 10, fontWeight: FontWeight.bold },
    reviewCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    reviewSection: {
      fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: Spacing.sm,
    },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
    reviewLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    reviewValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    disclaimer: {
      flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs,
      backgroundColor: colors.background, borderRadius: Radius.lg, padding: Spacing.md,
      marginBottom: Spacing.base, borderWidth: 1, borderColor: colors.border,
    },
    disclaimerText: { flex: 1, fontSize: FontSize.xs, color: colors.textMuted, lineHeight: 16 },
    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      backgroundColor: colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg,
      marginTop: Spacing.sm, ...Shadow.md,
    },
    primaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textOnDark },
    successWrap: { flex: 1, alignItems: 'center', paddingTop: Spacing.xxxl },
    successCircle: {
      width: 100, height: 100, borderRadius: 50, backgroundColor: colors.success,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...Shadow.lg,
    },
    successTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: colors.textPrimary, marginBottom: Spacing.sm },
    successSub: { fontSize: FontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
    refCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xxl, padding: Spacing.lg,
      width: '100%', marginBottom: Spacing.base, alignItems: 'center', ...Shadow.md,
    },
    refLabel: { fontSize: FontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: Spacing.sm },
    refValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: colors.primary, marginBottom: Spacing.base, letterSpacing: 1 },
    refDetails: { width: '100%' },
    refRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
    refRowLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    refRowValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
  });
}
