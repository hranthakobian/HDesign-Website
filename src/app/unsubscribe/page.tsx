"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(emailParam ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleUnsubscribe = async (targetEmail: string) => {
    if (!targetEmail) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch(`/api/subscribe?email=${encodeURIComponent(targetEmail)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Չհաջողվեց ապաբաժանորդագրվել:');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Կապի սխալ։ Խնդրում ենք փորձել կրկին։');
    }
  };

  useEffect(() => {
    if (emailParam) {
      handleUnsubscribe(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Խնդրում ենք լրացնել էլ. հասցեն:');
      return;
    }
    handleUnsubscribe(email);
  };

  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
      <div className="unsubscribe-card" style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "40px",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "480px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        textAlign: "center"
      }}>
        {status === 'loading' && (
          <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <span className="icon-Notifications" style={{ fontSize: "3rem", color: "var(--text)", animation: "spin 2s linear infinite" }} />
            <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", margin: 0 }}>Ապաբաժանորդագրվում է...</h2>
            <p style={{ opacity: 0.7, margin: 0, fontSize: "0.9rem" }}>Խնդրում ենք սպասել, հարցումը մշակվում է։</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <span className="icon-Check" style={{ fontSize: "4rem", color: "#81c784" }} />
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>Ապաբաժանորդագրված է</h2>
            <p style={{ opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>
              Դուք հաջողությամբ ապաբաժանորդագրվել եք HDesign-ի նորություններից և այլևս նամակներ չեք ստանա։
            </p>
            <div style={{ marginTop: "10px" }}>
              <hd-button onClick={() => router.push('/')} data-width="100%" data-height="44px" data-thickness="3px">
                Գնալ Գլխավոր Էջ
              </hd-button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <span className="icon-Trash" style={{ fontSize: "4rem", color: "#ff6b6b" }} />
            <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", margin: 0, color: "#ff6b6b" }}>Սխալ տեղի ունեցավ</h2>
            <p style={{ opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>
              {errorMessage || "Ապաբաժանորդագրումը ձախողվեց:"}
            </p>
            <div style={{ marginTop: "10px" }}>
              <hd-button onClick={() => setStatus('idle')} data-width="100%" data-height="44px" data-thickness="3px">
                Փորձել կրկին
              </hd-button>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <span className="icon-Mail" style={{ fontSize: "3rem", color: "var(--text)", opacity: 0.9 }} />
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>Ապաբաժանորդագրվել</h2>
              <p style={{ opacity: 0.7, fontSize: "0.88rem", marginTop: "6px", margin: 0, lineHeight: "1.4" }}>
                Մուտքագրեք ձեր էլ. հասցեն՝ HDesign-ի նորությունների բաժանորդագրությունը չեղարկելու համար։
              </p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
              <hd-input 
                type="email"
                placeholder="Ձեր էլ. հասցեն..."
                value={email}
                onInput={(e: any) => setEmail(e.target.value)}
                data-width="100%"
                data-height="44px"
                data-thickness="3px"
              data-font-size="14pt" />
              {errorMessage && (
                <div style={{ fontSize: "0.8rem", color: "#ff6b6b" }}>
                  {errorMessage}
                </div>
              )}
              <hd-button type="submit" data-width="100%" data-height="46px" data-thickness="3px" style={{ background: "linear-gradient(135deg, #ab47bc 0%, #ec407a 100%)", border: "none", color: "#fff" }}>
                Չեղարկել Բաժանորդագրությունը
              </hd-button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <main className="shell" style={{ marginTop: "140px", minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div>Բեռնվում է...</div>
      </main>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
