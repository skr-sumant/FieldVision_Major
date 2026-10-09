import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Mail, CheckCircle, ShieldCheck, ArrowLeft, RefreshCw, Clock } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }) {
  const { sendPasswordResetOtp, resetPasswordWithOtp } = useAuth();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [infoMsg, setInfoMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  if (!isOpen) return null;

  const handleSendOtp = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const res = sendPasswordResetOtp(email);
    if (res.success) {
      setTargetUser(res.user);
      setGeneratedOtp(res.otp);
      setInfoMsg(res.message);
      setStep(2);
      setTimerSeconds(60);
      setIsTimerActive(true);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (otpInput.trim() === generatedOtp) {
      setInfoMsg('OTP verified! Please enter your new password.');
      setStep(3);
      setIsTimerActive(false);
    } else {
      setErrorMsg('Invalid OTP. Please check the authentication code sent to your device.');
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 5) {
      setErrorMsg('Password must be at least 5 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const res = resetPasswordWithOtp(targetUser.id, newPassword);
    if (res.success) {
      alert(res.message);
      onBackToLogin();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button
            onClick={onBackToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Step {step} of 3</span>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
          {step === 1 && 'Reset Password'}
          {step === 2 && 'Verify Mobile OTP'}
          {step === 3 && 'Create New Password'}
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px' }}>
          {step === 1 && 'Enter your registered enterprise email to receive an authentication OTP.'}
          {step === 2 && `An authentication OTP has been sent to ${targetUser?.phone}.`}
          {step === 3 && `Set a new secure password for ${targetUser?.name} (${targetUser?.email}).`}
        </p>

        {errorMsg && (
          <div style={{
            padding: '10px',
            borderRadius: '6px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f87171',
            fontSize: '0.82rem',
            marginBottom: '14px'
          }}>
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div style={{
            padding: '10px',
            borderRadius: '6px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.82rem',
            marginBottom: '14px'
          }}>
            {infoMsg}
          </div>
        )}

        {/* Step 1: Send OTP */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Registered Enterprise Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. manager@fieldvision.in or rahul@fieldvision.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              Send Authentication OTP
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Enter 4-Digit OTP</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter 4-digit code"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                required
                style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '8px', fontWeight: 800 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '0.78rem', color: '#94a3b8' }}>
              <span>
                {isTimerActive ? (
                  <>⏱️ Resend OTP in <strong>{timerSeconds}s</strong></>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Resend OTP Code
                  </button>
                )}
              </span>
            </div>

            <button type="submit" className="btn btn-emerald" style={{ width: '100%', marginTop: '4px' }}>
              <ShieldCheck size={16} /> Verify OTP Code
            </button>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              <CheckCircle size={16} /> Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
