import React, { useState } from 'react';
import { QRCodeItem, UserProfile } from '../types';
import { QrCode, MapPin, Sparkles, Camera, Search, Printer, ShieldCheck, Loader2, Lock, ShieldAlert, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { FirebaseQRService } from '../services/firebaseService';

interface TreasureHuntSectionProps {
  user: UserProfile;
  qrCodes: QRCodeItem[];
  onRedeemSuccess?: () => void;
}

export const TreasureHuntSection: React.FC<TreasureHuntSectionProps> = ({
  user,
  qrCodes,
  onRedeemSuccess
}) => {
  const [scannedCodeInput, setScannedCodeInput] = useState('');
  const [selectedQrToRedeem, setSelectedQrToRedeem] = useState<QRCodeItem | null>(null);
  const [bankName, setBankName] = useState(user.bankDetails?.bankName || 'GTBank');
  const [accountNumber, setAccountNumber] = useState(user.bankDetails?.accountNumber || '');
  const [accountName, setAccountName] = useState(user.bankDetails?.accountName || user.name);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null);
  
  // Admin Poster Generator Lock & Customization State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminLockModal, setShowAdminLockModal] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [showPosterPreview, setShowPosterPreview] = useState(false);

  // Custom poster details
  const [customCampus, setCustomCampus] = useState(user.campus || 'UNILAG');
  const [customLocationHint, setCustomLocationHint] = useState('Faculty of Science Noticeboard');
  const [customCodeOrLink, setCustomCodeOrLink] = useState('NEARBY-UNILAG-FAC01');
  const [customPrizeNaira, setCustomPrizeNaira] = useState(2500);

  const monthQrCodes = qrCodes.filter((q) => q.monthNumber === selectedMonth);
  const totalInBatch = monthQrCodes.length || 10;
  const redeemedCount = monthQrCodes.filter((q) => q.isRedeemed).length;
  const remainingCount = totalInBatch - redeemedCount;

  const handleOpenPosterGenerator = () => {
    if (isAdminUnlocked) {
      setShowPosterPreview(true);
    } else {
      setPasskeyInput('');
      setPasskeyError(null);
      setShowAdminLockModal(true);
    }
  };

  const handleVerifyPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput.trim() === 'fas1paz0l') {
      setIsAdminUnlocked(true);
      setShowAdminLockModal(false);
      setShowPosterPreview(true);
    } else {
      setPasskeyError('Invalid Admin Passkey! Verified admin access required.');
    }
  };

  const handleVerifyInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCodeInput.trim()) return;
    setErrorMsg(null);

    const matched = qrCodes.find(
      (q) => q.code.toUpperCase() === scannedCodeInput.trim().toUpperCase()
    );

    if (!matched) {
      setErrorMsg('Invalid Treasure QR Code! Please check the code printed on official campus posters.');
      return;
    }

    if (matched.isRedeemed) {
      setErrorMsg(`Treasure Code #${matched.code} was already claimed by ${matched.redeemedByName || 'another student'}!`);
      return;
    }

    // Code verified and correct! Proceed to bank account claim details form
    setSelectedQrToRedeem(matched);
    setScannedCodeInput('');
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQrToRedeem || !accountNumber.trim() || !bankName.trim() || !accountName.trim()) return;

    setIsRedeeming(true);
    setErrorMsg(null);

    try {
      const res = await FirebaseQRService.redeemQRCode(user.id, selectedQrToRedeem.id, selectedQrToRedeem.code, {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim()
      });

      if (!res.success) {
        setErrorMsg(res.message);
        setIsRedeeming(false);
        return;
      }

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });

      setScanSuccessMsg(`🎉 Success! You claimed Treasure #${selectedQrToRedeem.code} for ₦${(res.prizeNaira || 2000).toLocaleString()}! Cash payout request queued to ${accountName} (${bankName}).`);
      setSelectedQrToRedeem(null);
      if (onRedeemSuccess) onRedeemSuccess();
      setTimeout(() => setScanSuccessMsg(null), 8000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify reward. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <section id="treasure-hunt" className="py-12 sm:py-16 bg-[#FAFAFA] dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-slate-800 transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 min-w-0">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] dark:border-slate-800 pb-6 min-w-0">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-3.5 py-1.5 rounded-full mb-2">
              <QrCode className="w-4 h-4 text-[#F59E0B]" />
              <span>Campus QR Hunt</span>
            </div>
            <h2 className="text-[26px] sm:text-[36px] font-extrabold text-[#111827] dark:text-white font-display tracking-tight break-words">
              Campus Treasure Hunt Games
            </h2>
            <p className="text-[#6B7280] dark:text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
              Physical QR codes are hidden around Nigerian university campuses and cafeterias. Find them, scan with your camera, and enter your bank account to claim instant cash prizes!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleOpenPosterGenerator}
              className="h-[48px] sm:h-[56px] px-4 sm:px-5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#111827] dark:text-white font-bold text-xs rounded-[18px] border border-[#E5E7EB] dark:border-slate-700 shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#16A34A]" />
              <span>Campus Poster Generator</span>
            </motion.button>
          </div>
        </div>

        {/* Success Message Banner */}
        <AnimatePresence>
          {scanSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#16A34A] border-2 border-[#15803D] p-4 rounded-[20px] text-white text-xs sm:text-sm font-bold flex items-center gap-3 shadow-md"
            >
              <Sparkles className="w-6 h-6 text-amber-300 flex-shrink-0 animate-spin" />
              <span>{scanSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Banner */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 p-4 rounded-[20px] text-red-600 dark:text-red-400 text-xs sm:text-sm font-bold flex items-center justify-between gap-3"
            >
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-xs underline font-bold cursor-pointer">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campaign Info & Scanner */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-5 sm:p-6 space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#16A34A]">Campus Batch:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMonth(m)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        selectedMonth === m
                          ? 'bg-[#16A34A] text-white shadow-sm'
                          : 'bg-[#F3F4F6] dark:bg-slate-800 text-[#6B7280] dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Month {m}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs text-[#F59E0B] font-mono font-bold bg-[#F59E0B]/10 px-3 py-1 rounded-full border border-[#F59E0B]/20">
                {totalInBatch} Active Hunt Codes
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FAFAFA] dark:bg-slate-900 p-3.5 rounded-[16px] border border-[#E5E7EB] dark:border-slate-800 text-center">
                <div className="text-xs text-[#6B7280] dark:text-slate-400">Redeemed Codes</div>
                <div className="text-2xl font-extrabold text-[#F59E0B] font-display">{redeemedCount} / {totalInBatch}</div>
              </div>
              <div className="bg-[#FAFAFA] dark:bg-slate-900 p-3.5 rounded-[16px] border border-[#E5E7EB] dark:border-slate-800 text-center">
                <div className="text-xs text-[#6B7280] dark:text-slate-400">Remaining Hidden</div>
                <div className="text-2xl font-extrabold text-[#16A34A] dark:text-emerald-400 font-display">{remainingCount} Active</div>
              </div>
            </div>

            <p className="text-xs text-[#6B7280] dark:text-slate-300 leading-relaxed">
              <strong>Verified Security:</strong> All reward codes are securely validated. Every redemption is processed with strict anti-fraud protection.
            </p>
          </div>

          {/* Code Verifier / Scanner Card */}
          <div className="lg:col-span-5 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-5 sm:p-6 space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.05)]">
            <h3 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white font-display flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#16A34A]" />
              Enter Campus Treasure Code
            </h3>

            <p className="text-xs text-[#6B7280] dark:text-slate-300">
              Found a poster on campus? Enter the Treasure Code written on it:
            </p>

            <form onSubmit={handleVerifyInput} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. NEARBY-UNILAG-LIB01"
                  value={scannedCodeInput}
                  onChange={(e) => setScannedCodeInput(e.target.value)}
                  className="w-full h-[52px] sm:h-[56px] bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] px-4 text-xs font-bold text-[#16A34A] dark:text-emerald-400 font-mono focus:outline-none focus:border-[#16A34A]"
                />
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="h-[52px] sm:h-[56px] px-6 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-[18px] transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0 shadow-md"
                >
                  <Search className="w-4 h-4" />
                  <span>Verify</span>
                </motion.button>
              </div>
            </form>

            <div className="text-[11px] text-[#6B7280] dark:text-slate-400 bg-[#FAFAFA] dark:bg-slate-900 p-3 rounded-[14px] border border-[#E5E7EB] dark:border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
              <span>Instant verification prevents duplicate claims and keeps reward distributions fair.</span>
            </div>
          </div>
        </div>

        {/* Campus Treasure Map Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white font-display flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#16A34A]" /> Month {selectedMonth} Campus QR Locations & Rewards
            </h3>
            <span className="text-xs text-[#6B7280] dark:text-slate-400">Live Activity Feed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {monthQrCodes.map((qr) => (
              <motion.div
                key={qr.id}
                whileHover={{ y: -3 }}
                onClick={() => {
                  if (!qr.isRedeemed) {
                    setErrorMsg(null);
                    setScanSuccessMsg(`🔒 Code is secret & hidden! Go to ${qr.campusName} (${qr.locationHint}), find the physical poster, and enter the code printed on it in the box above to claim ₦${(qr.prizeNaira || 2000).toLocaleString()}!`);
                  }
                }}
                className={`p-4 rounded-[20px] border transition-all cursor-pointer relative flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.05)] ${
                  qr.isRedeemed
                    ? 'bg-[#FAFAFA] dark:bg-slate-900/60 border-[#E5E7EB] dark:border-slate-800 opacity-70'
                    : 'bg-white dark:bg-[#1E293B] border-[#16A34A]/50 hover:border-[#16A34A]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold">
                      {qr.isRedeemed ? (
                        <span className="text-[#6B7280] dark:text-slate-400 font-mono">REDEEMED: {qr.code}</span>
                      ) : (
                        <span className="text-[#F59E0B] font-mono flex items-center gap-1 font-extrabold">
                          <Lock className="w-3 h-3 inline text-[#F59E0B]" /> SECRET CODE HIDDEN
                        </span>
                      )}
                    </span>
                    {qr.isRedeemed ? (
                      <span className="text-[10px] bg-[#F3F4F6] dark:bg-slate-800 text-[#6B7280] dark:text-slate-400 px-2 py-0.5 rounded font-bold">REDEEMED</span>
                    ) : (
                      <span className="text-[10px] bg-[#16A34A]/10 text-[#16A34A] dark:text-emerald-400 px-2 py-0.5 rounded font-bold">ACTIVE</span>
                    )}
                  </div>

                  <div className="font-bold text-[#111827] dark:text-white text-xs flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                    <span className="truncate">{qr.campusName}</span>
                  </div>

                  <p className="text-[11px] text-[#6B7280] dark:text-slate-400 mt-1.5 italic line-clamp-2">
                    💡 Hint: {qr.locationHint}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-extrabold text-[#16A34A] dark:text-emerald-400 font-mono">
                    ₦{qr.prizeNaira ? qr.prizeNaira.toLocaleString() : '2,000'}
                  </div>
                  <div className="text-[10px]">
                    {qr.isRedeemed ? (
                      <span className="text-[#6B7280] dark:text-slate-500 font-medium truncate max-w-[80px] block">
                        Found by {qr.redeemedByName || 'Student'}
                      </span>
                    ) : (
                      <span className="text-[#16A34A] font-bold">Find on Campus →</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Redeem Cash Modal */}
      <AnimatePresence>
        {selectedQrToRedeem && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#1E293B] border-2 border-[#16A34A] rounded-[24px] p-6 max-w-md w-full space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedQrToRedeem(null)}
                className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 cursor-pointer"
              >
                ✕
              </button>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 border border-[#16A34A] mx-auto flex items-center justify-center text-[#16A34A]">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white font-display">Treasure Code Discovered!</h3>
                <p className="text-xs text-[#16A34A] dark:text-emerald-400 font-mono font-bold">
                  {selectedQrToRedeem.code} — ₦{selectedQrToRedeem.prizeNaira?.toLocaleString() || '2,000'} Cash
                </p>
                <p className="text-[11px] text-[#6B7280] dark:text-slate-400">{selectedQrToRedeem.campusName}</p>
              </div>

              <p className="text-xs text-[#6B7280] dark:text-slate-300 text-center">
                Please confirm your Bank Account details below to claim your verified server reward:
              </p>

              <form onSubmit={handleRedeemSubmit} className="space-y-3">
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

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  disabled={isRedeeming}
                  className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[18px] text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Claim & Submit Cash Payout Request</span>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Lock Passkey Modal */}
      <AnimatePresence>
        {showAdminLockModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 max-w-md w-full space-y-4 shadow-2xl relative"
            >
              <button onClick={() => setShowAdminLockModal(false)} className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 hover:text-black dark:hover:text-white cursor-pointer">✕</button>

              <div className="w-12 h-12 bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-2xl flex items-center justify-center mx-auto text-[#16A34A]">
                <Lock className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold text-[#111827] dark:text-white font-display">Admin Lock Protected</h3>
                <p className="text-xs text-[#6B7280] dark:text-slate-300">
                  The Campus Poster Generator is restricted to verified campus admins. Enter the security lock code to continue:
                </p>
              </div>

              <form onSubmit={handleVerifyPasskey} className="space-y-3 pt-2">
                <div>
                  <input
                    type="password"
                    placeholder="Enter Admin Lock Code..."
                    value={passkeyInput}
                    onChange={(e) => {
                      setPasskeyInput(e.target.value);
                      setPasskeyError(null);
                    }}
                    className="w-full h-[50px] bg-[#F3F4F6] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-[16px] px-4 text-sm font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                    autoFocus
                  />
                  {passkeyError && (
                    <p className="text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{passkeyError}</span>
                    </p>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="w-full h-[50px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[16px] text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Campus Poster Generator</span>
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Campus Poster Customizer & Printable Generator Modal */}
      <AnimatePresence>
        {showPosterPreview && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700 rounded-[24px] p-6 max-w-xl w-full space-y-5 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowPosterPreview(false)} className="absolute top-4 right-4 text-[#6B7280] dark:text-slate-400 hover:text-black dark:hover:text-white cursor-pointer">✕</button>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED ADMIN AUTHORIZED
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#111827] dark:text-white font-display flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#16A34A]" /> Campus Poster & Barcode Customizer
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-slate-300 mt-1">
                  Customize the campus link, code, target location aim, and prize amount before printing or downloading barcodes for physical campus distribution.
                </p>
              </div>

              {/* Admin Customization Form Inputs */}
              <div className="grid sm:grid-cols-2 gap-3 bg-[#FAFAFA] dark:bg-slate-900/80 p-4 rounded-[18px] border border-[#E5E7EB] dark:border-slate-800">
                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Campus / University:</label>
                  <input
                    type="text"
                    value={customCampus}
                    onChange={(e) => setCustomCampus(e.target.value)}
                    placeholder="e.g. UNILAG, UNIOSUN, UI"
                    className="w-full h-[44px] mt-1 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] px-3 text-xs font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Location / Campaign Aim:</label>
                  <input
                    type="text"
                    value={customLocationHint}
                    onChange={(e) => setCustomLocationHint(e.target.value)}
                    placeholder="e.g. Main Library Noticeboard"
                    className="w-full h-[44px] mt-1 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] px-3 text-xs font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Custom Code / QR Link:</label>
                  <input
                    type="text"
                    value={customCodeOrLink}
                    onChange={(e) => setCustomCodeOrLink(e.target.value)}
                    placeholder="e.g. NEARBY-UNILAG-LIB01"
                    className="w-full h-[44px] mt-1 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] px-3 text-xs font-mono font-bold text-[#16A34A] focus:outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111827] dark:text-slate-200">Prize Amount (₦):</label>
                  <input
                    type="number"
                    value={customPrizeNaira}
                    onChange={(e) => setCustomPrizeNaira(Number(e.target.value))}
                    className="w-full h-[44px] mt-1 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] px-3 text-xs font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>

              {/* Real-time Generated Poster Visual */}
              <div className="bg-[#16A34A] p-6 rounded-[20px] text-center text-white space-y-3 shadow-lg border-4 border-white">
                <div className="text-[11px] uppercase font-extrabold tracking-widest text-emerald-100">
                  {customCampus || 'CAMPUS'} — {customLocationHint || 'SPOT'}
                </div>
                <h4 className="text-2xl font-extrabold font-display leading-tight">SCAN THIS BARCODE / QR TO WIN TREASURE!</h4>
                
                <div className="bg-white p-3.5 rounded-[18px] inline-block my-2 shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(customCodeOrLink || 'NEARBY-CAMPUS-01')}`}
                    alt="Custom Barcode Poster"
                    className="w-36 h-36 mx-auto"
                  />
                </div>

                <div className="text-xs font-mono font-bold bg-slate-900/90 text-amber-300 px-4 py-1.5 rounded-full inline-block shadow-sm">
                  CODE: {customCodeOrLink || 'NEARBY-CAMPUS-01'}
                </div>

                <div className="text-xs text-emerald-100 font-semibold">
                  Instant Reward: <span className="font-extrabold text-amber-300">₦{Number(customPrizeNaira || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    window.print();
                  }}
                  className="w-full h-[48px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-[16px] text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Printable Campus Poster</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
