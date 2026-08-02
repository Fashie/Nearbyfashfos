import React, { useState } from 'react';
import { UserProfile, PayoutRequest } from '../types';
import { Wallet, Check, ShieldCheck, Loader2, AlertCircle, History, Clock, Camera, Instagram, Twitter, Video, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FirebasePayoutService } from '../services/firebaseService';

interface PayoutModalProps {
  isOpen: boolean;
  user: UserProfile;
  payoutHistory: PayoutRequest[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const PayoutModal: React.FC<PayoutModalProps> = ({
  isOpen,
  user,
  payoutHistory,
  onClose,
  onSuccess
}) => {
  const [bankName, setBankName] = useState(user.bankDetails?.bankName || 'GTBank');
  const [accountNumber, setAccountNumber] = useState(user.bankDetails?.accountNumber || '');
  const [accountName, setAccountName] = useState(user.bankDetails?.accountName || user.name);
  const [amountNaira, setAmountNaira] = useState(user.claimableBalanceNaira);
  const [step, setStep] = useState<'details' | 'social_task' | 'submitted'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [lastPayoutId, setLastPayoutId] = useState<string | null>(null);
  const [socialHandleInput, setSocialHandleInput] = useState('');

  if (!isOpen) return null;

  const handleProceedToTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNaira <= 0 || !accountNumber.trim() || !accountName.trim()) {
      setErrorMsg('Please complete all required bank details fields accurately.');
      return;
    }
    if (accountNumber.trim().length !== 10) {
      setErrorMsg('Please enter a valid 10-digit account number.');
      return;
    }
    setErrorMsg(null);
    setStep('social_task');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialHandleInput.trim()) {
      setErrorMsg('⚠️ Please enter your social handle or tagged post URL so our verification team can confirm your tag!');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await FirebasePayoutService.requestPayout(
        user.id,
        {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim()
        },
        amountNaira
      );

      if (!res.success) {
        setErrorMsg(res.message);
        setIsSubmitting(false);
        return;
      }

      if (res.payoutId) {
        setLastPayoutId(res.payoutId);
        await FirebasePayoutService.updatePayoutSocialTag(res.payoutId, socialHandleInput.trim());
      }

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });

      setStep('submitted');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error requesting payout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 cursor-pointer">✕</button>

        <div className="flex items-center justify-between border-b border-[#F3F4F6] dark:border-slate-700 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#16A34A]/10 rounded-[14px] text-[#16A34A]">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#111827] dark:text-white font-display">Bank Cash Withdrawal</h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-400">Claimable Balance: <strong className="text-[#16A34A] dark:text-emerald-400">₦{user.claimableBalanceNaira.toLocaleString()}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#F3F4F6] dark:bg-slate-900 p-1 rounded-[12px]">
            <button
              onClick={() => setActiveTab('request')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[8px] cursor-pointer ${
                activeTab === 'request' ? 'bg-[#16A34A] text-white' : 'text-[#6B7280] dark:text-slate-400'
              }`}
            >
              Request
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[8px] cursor-pointer ${
                activeTab === 'history' ? 'bg-[#16A34A] text-white' : 'text-[#6B7280] dark:text-slate-400'
              }`}
            >
              History ({payoutHistory.length})
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[12px] text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {activeTab === 'request' ? (
          step === 'details' ? (
            /* STEP 1: Bank Details Form */
            <form onSubmit={handleProceedToTask} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Amount to Withdraw (₦):</label>
                <input
                  type="number"
                  required
                  max={user.claimableBalanceNaira}
                  min={1000}
                  value={amountNaira}
                  onChange={(e) => setAmountNaira(Number(e.target.value))}
                  className="w-full h-[52px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] px-4 text-xs font-mono font-bold text-[#16A34A] dark:text-emerald-400 focus:outline-none focus:border-[#16A34A]"
                />
                <div className="text-[10px] text-[#6B7280] dark:text-slate-400 mt-1">Minimum withdrawal: ₦1,000</div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Select Bank:</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-[52px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] px-4 text-xs font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                  <option value="FirstBank">First Bank of Nigeria</option>
                  <option value="UBA">United Bank for Africa (UBA)</option>
                  <option value="Zenith">Zenith Bank</option>
                  <option value="Access">Access Bank</option>
                  <option value="OPay">OPay Digital Bank</option>
                  <option value="Kuda">Kuda Microfinance Bank</option>
                  <option value="Palmpay">PalmPay</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Account Holder Name:</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full h-[52px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] px-4 text-xs font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111827] dark:text-slate-200">10-Digit Account Number:</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full h-[52px] mt-1 bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] px-4 text-xs font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="text-[11px] text-[#6B7280] dark:text-slate-400 flex items-center gap-1.5 bg-[#FAFAFA] dark:bg-slate-900 p-2.5 rounded-[12px] border border-[#E5E7EB] dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                <span>Step 1 of 2: Fill bank details then proceed to mandatory social tag verification.</span>
              </div>

              <button
                type="submit"
                disabled={user.claimableBalanceNaira < 1000 || amountNaira > user.claimableBalanceNaira}
                className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:text-gray-500 text-white font-bold rounded-[18px] text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>Proceed to Receipt & Social Tag Task →</span>
              </button>
            </form>
          ) : step === 'social_task' ? (
            /* STEP 2: Payment Receipt & Mandatory Social Tag Task */
            <form onSubmit={handleFinalSubmit} className="space-y-4 py-1">
              {/* Payment Receipt Preview Card */}
              <div className="bg-[#FAFAFA] dark:bg-slate-900 border-2 border-dashed border-[#16A34A] p-4 rounded-[20px] space-y-2.5 font-mono text-xs relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-slate-800 pb-2">
                  <span className="font-bold text-[#111827] dark:text-white">NEARBY PAYMENT RECEIPT SUMMARY</span>
                  <span className="text-[10px] bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded font-bold">TAG REQUIRED</span>
                </div>

                <div className="space-y-1 text-[#4B5563] dark:text-slate-300 text-[11px]">
                  <div className="flex justify-between"><span>Amount:</span> <strong className="text-[#16A34A]">₦{amountNaira.toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span>Bank:</span> <strong>{bankName}</strong></div>
                  <div className="flex justify-between"><span>Account Holder:</span> <strong>{accountName}</strong></div>
                  <div className="flex justify-between"><span>Account Number:</span> <strong>{accountNumber}</strong></div>
                  <div className="flex justify-between"><span>Date:</span> <strong>{new Date().toLocaleDateString()}</strong></div>
                </div>
              </div>

              {/* Mandatory Social Media Tag Requirement */}
              <div className="bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#F59E0B]/40 rounded-[18px] p-4 space-y-3">
                <div className="flex items-center gap-2 text-[#F59E0B]">
                  <Camera className="w-5 h-5 flex-shrink-0" />
                  <h5 className="text-xs font-extrabold text-[#111827] dark:text-white uppercase font-display">
                    Mandatory Last Step: Screenshot & Tag @nearby_app_
                  </h5>
                </div>
                <p className="text-[11px] text-[#6B7280] dark:text-slate-300 leading-relaxed">
                  Before our admin team can review and credit your bank account:
                  <br />1. 📸 <strong>Take a screenshot</strong> of the Payment Receipt card above.
                  <br />2. Click any social media button below to open the app or site.
                  <br />3. Post the screenshot on your story or page and <strong>tag @nearby_app_</strong>.
                  <br />4. Enter your social handle or post link below for verification!
                </p>

                {/* Quick Share Links */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <a
                    href="https://instagram.com/nearby_app_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:border-[#E1306C] rounded-[12px] flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#E1306C]"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Just requested a cash withdrawal of ₦${amountNaira.toLocaleString()} on @nearby_app_! 🚀 Join me on Nearby to earn cash rewards on campus!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:border-sky-500 rounded-[12px] flex items-center justify-center gap-1.5 text-[11px] font-bold text-sky-500"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>X (Twitter)</span>
                  </a>
                  <a
                    href="https://tiktok.com/@nearby_app_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:border-pink-500 rounded-[12px] flex items-center justify-center gap-1.5 text-[11px] font-bold text-pink-500"
                  >
                    <Video className="w-4 h-4" />
                    <span>TikTok</span>
                  </a>
                  <a
                    href="https://linkedin.com/company/nearby_app_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:border-blue-600 rounded-[12px] flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-600"
                  >
                    <div className="w-3.5 h-3.5 bg-blue-600 text-white font-extrabold text-[8px] rounded flex items-center justify-center">in</div>
                    <span>LinkedIn</span>
                  </a>
                </div>

                {/* Social Handle Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-extrabold text-[#111827] dark:text-slate-200">
                    Your Social Handle or Tagged Post URL: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. @your_username or https://instagram.com/p/..."
                    value={socialHandleInput}
                    onChange={(e) => setSocialHandleInput(e.target.value)}
                    className="w-full h-[48px] bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[14px] px-3.5 text-xs font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="px-4 h-[52px] bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 text-[#111827] dark:text-white font-bold text-xs rounded-[16px] cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !socialHandleInput.trim()}
                  className="flex-1 h-[52px] bg-[#16A34A] hover:bg-[#15803D] disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:text-gray-500 text-white font-bold rounded-[16px] text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Request to Admin...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Withdrawal Request to Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 3: Submitted Confirmation */
            <div className="space-y-4 py-2">
              <div className="p-4 bg-[#16A34A]/10 border border-[#16A34A]/30 rounded-[20px] text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#16A34A] text-white flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-[#111827] dark:text-white font-display">Withdrawal Request Submitted to Admin!</h4>
                <p className="text-xs text-[#6B7280] dark:text-slate-300">
                  Your request of <strong className="text-[#16A34A] dark:text-emerald-400">₦{amountNaira.toLocaleString()}</strong> to {accountName} ({bankName} • {accountNumber}) has been queued.
                </p>
                <p className="text-[11px] text-[#16A34A] font-bold bg-[#16A34A]/10 p-2 rounded-[12px] inline-block">
                  Social Tag Proof Recorded: {socialHandleInput}
                </p>
              </div>

              <div className="p-4 bg-[#FAFAFA] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[18px] space-y-2 text-xs text-[#6B7280] dark:text-slate-300">
                <div className="flex items-center gap-2 text-[#111827] dark:text-white font-bold">
                  <Clock className="w-4 h-4 text-[#16A34A]" />
                  <span>Next Steps for Payout:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Our admin team will verify your social media tag on <strong>@nearby_app_</strong> and credit your bank account. You can monitor request status under the <strong>History</strong> tab anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('details');
                  onClose();
                }}
                className="w-full h-[48px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[16px] text-xs cursor-pointer shadow-md"
              >
                Done / Close
              </button>
            </div>
          )
        ) : (
          /* History Tab */
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {payoutHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#6B7280] dark:text-slate-400 space-y-2">
                <History className="w-8 h-8 text-[#6B7280] dark:text-slate-500 mx-auto opacity-50" />
                <div>No payout requests recorded yet.</div>
              </div>
            ) : (
              payoutHistory.map((p) => (
                <div key={p.id} className="p-3 bg-[#FAFAFA] dark:bg-slate-900 rounded-[14px] border border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#111827] dark:text-white font-mono">
                      ₦{p.amount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#6B7280] dark:text-slate-400">
                      {p.bankName} • {p.accountNumber}
                    </div>
                    <div className="text-[10px] text-[#6B7280] dark:text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(p.timestamp).toLocaleDateString()}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    p.status === 'paid' ? 'bg-[#16A34A]/10 text-[#16A34A]' :
                    p.status === 'approved' ? 'bg-sky-500/10 text-sky-500' :
                    p.status === 'pending_review' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
