import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SupportPromptModalProps {
  open: boolean;
  onClose: () => void;
}

const SupportPromptModal: React.FC<SupportPromptModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  if (!open) return null;
  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div 
        className="modal-container"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#212A31',
          border: '1px solid #2E3944',
          borderRadius: '12px',
          minWidth: '0',
          maxWidth: '380px',
          width: '90vw',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{fontSize: 40, marginBottom: 12}}>
          <Image 
            src="https://assets.jailbreakchangelogs.xyz/assets/images/JBCLHeart.webp"
            alt="JailbreakChangelogs Heart"
            width={48}
            height={48}
            style={{ display: 'inline-block' }}
            priority
            unoptimized
            draggable={false}
          />
        </div>
        <h2 style={{color:'#fff', fontWeight:700, fontSize:'1.5rem', marginBottom:8}}>Support JailbreakChangelogs</h2>
        <p style={{color:'#D3D9D4', marginBottom:24}}>
          By supporting Jailbreak Changelogs, you&apos;re helping us maintain and improve this open-source project, community made for Roblox Jailbreak. Your support enables us to continue providing accurate, timely updates and new features to help the community stay informed about their favorite game.
        </p>
        <Link 
          href="/supporting"
          style={{
            display: 'block',
            width: '100%',
            background: '#5865F2',
            color: '#fff',
            fontWeight: 800,
            borderRadius: 8,
            padding: '1rem 0',
            textDecoration: 'none',
            fontSize: '1.2rem',
            boxShadow: '0 2px 8px rgba(88,101,242,0.15)',
            transition: 'background 0.2s, color 0.2s',
            marginBottom: 16,
            border: 'none',
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#4752C4')}
          onMouseOut={e => (e.currentTarget.style.background = '#5865F2')}
          onClick={onClose}
        >
          Become a Supporter
        </Link>
        <button
          onClick={onClose}
          style={{
            display: 'block',
            width: '100%',
            background: 'none',
            border: '1px solid #5865F2',
            color: '#A0AEC0',
            fontWeight: 500,
            borderRadius: 8,
            padding: '0.9rem 0',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
            marginTop: 0,
            opacity: 0.85,
            textAlign: 'center',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#232F3E')}
          onMouseOut={e => (e.currentTarget.style.background = 'none')}
        >
          Remind me later
        </button>
      </div>
    </div>
  );
};

export default SupportPromptModal; 