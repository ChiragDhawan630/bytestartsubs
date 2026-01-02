import styles from "./page.module.css";

interface Plan {
  id: string;
  name: string;
  price_original: number;
  price_discounted: number;
  features: string;
  billing_cycle: string;
  price_color: string;
}

async function getPlans() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/public/plans`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      console.error('Failed to fetch plans', res.status);
      return [];
    }
    return res.json();
  } catch (e) {
    console.error('Error fetching plans', e);
    return [];
  }
}

export default async function Home() {
  const plans: Plan[] = await getPlans();

  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.title}>Premium Pricing Plans<br />For Everyone</h1>
          <p className={styles.subtitle}>
            Unlock generic value with our generic plans. Start your journey today with our best-in-class features.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="#plans" className="btn btn-primary">Get Started</a>
            <a href="/login" className="btn btn-secondary">Login</a>
          </div>
        </div>
      </section>

      <section id="plans" className="container">
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>Our Plans</h2>
        <div className={styles.plansGrid}>
          {plans.length === 0 ? (
            <p style={{ textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>
              No plans available at the moment.
            </p>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.5rem' }}>{plan.name}</h3>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 700, color: plan.price_color || 'inherit' }}>
                    ₹{plan.price_discounted}
                  </span>
                  {plan.price_original && plan.price_original > plan.price_discounted && (
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                      ₹{plan.price_original}
                    </span>
                  )}
                  <span style={{ color: 'var(--text-muted)' }}>/{plan.billing_cycle}</span>
                </div>

                <ul style={{ listStyle: 'none', margin: '1rem 0', flex: 1 }}>
                  {(plan.features || '').split(',').map((f, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--success)' }}>✓</span>
                      {f.trim()}
                    </li>
                  ))}
                </ul>

                <a href={`/register?plan=${plan.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                  Subscribe Now
                </a>
              </div>
            ))
          )}
        </div>
      </section>

      <footer style={{ padding: '4rem 0', borderTop: '1px solid var(--border)', marginTop: '4rem' }}>
        <div className="container" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>&copy; {new Date().getFullYear()} ByteStart. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
