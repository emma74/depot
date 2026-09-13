import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const PRODUCTS = [
  {
    name: 'Coca-Cola',
    blurb: 'The original classic, ice-cold and ready to move.',
    color: '#9c2b3c',
    type: 'bottle',
    image: '/products/coca-cola.jpg.avif',
  },
  {
    name: 'Fanta Orange',
    blurb: 'Bright, fruity and a favourite with every generation.',
    color: '#e0791a',
    type: 'bottle',
    image: '/products/fanta-orange.jpg',
  },
   {
    name: 'Sprite',
    blurb: 'It’s That Fresh.',
    color: '#e0791a',
    type: 'bottle',
    image: '/products/sprite.jpg',
  },
  {
    name: 'Club tonic',
    blurb: 'Club Tonic',
    color: '#2e8b57',
    type: 'bottle',
    image: '/products/club.jpg',
  },
  {
    name: 'PET 0.3L (x12)',
    blurb: 'Compact 300ml PET bottles, packed 12 to a crate.',
    color: '#2f7fb0',
    type: 'bottle',
    image: '/products/pet-0.3l.jpg',
  },
  {
    name: 'PET 1.5L (x6)',
    blurb: 'Family-size 1.5L PET bottles, packed 6 to a crate.',
    color: '#1c5f87',
    type: 'bottle',
    image: '/products/pet-1.5l.jpg',
  },
   {
    name: 'PET 0.45L',
    blurb: 'Family-size 0.45L PET bottles, packed 6 to a crate.',
    color: '#1c5f87',
    type: 'bottle',
    image: '/products/pet-0.45l.jpg',
  },
    {
    name: 'PET 1L',
    blurb: 'Family-size 1L PET bottles, packed 6 to a crate.',
    color: '#1c5f87',
    type: 'bottle',
    image: '/products/pet-1l.jpg',
  },
  {
    name: 'Cans',
    blurb: '330ml cans, packed 24 to a case.',
    color: '#a6acb1',
    type: 'can',
    image: '/products/cans.jpg',
  },
  {
    name: 'vibe',
    blurb: 'Coca Cola energy to spread good vibes.',
    color: '#a6acb1',
    type: 'can',
    image: '/products/vibe.jpg',
  },
];

const WHY_CHOOSE_US = [
  {
    title: 'Reliable Delivery',
    text: 'On-time deliveries you can plan your stock around, every week.',
  },
  {
    title: 'Wide Product Range',
    text: 'Classic bottles, PET crates and cans — always in stock.',
  },
  {
    title: 'Competitive Pricing',
    text: 'Wholesale rates that protect your margins.',
  },
  {
    title: 'Trusted Locally',
    text: 'Supplying shops and businesses across Kumasi.',
  },
];

const WHO_WE_SERVE = [
  'Retail Stores',
  'Restaurants',
  'Filling Stations',
  'Events',
  'Offices',
  'Supermarkets',
  'Hotels',
  'Funerals',
  'Parties',
  'Small Shops',
];

const TESTIMONIALS = [
  {
    quote: 'Zongo Supermarket keeps my shop stocked every single week — orders are accurate and deliveries are always on time.',
    author: 'M. Owusu',
    role: 'Shop Owner, Kumasi',
  },
  {
    quote: 'Switching our supply chain over to Zongo Supermarket cut our stock-outs to almost zero. Their team just gets it.',
    author: 'A. Boateng',
    role: 'Restaurant Manager, Kumasi',
  },
  {
    quote: 'Transparent pricing, easy returns on empties, and a team that actually picks up the phone.',
    author: 'S. Mensah',
    role: 'Wholesale Distributor, Kumasi',
  },
];

export default function LandingPage() {
  const [failedImages, setFailedImages] = useState(() => new Set());

  const markFailed = (name) =>
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.add(name);
      return next;
    });

  const [featuredTestimonial, ...otherTestimonials] = TESTIMONIALS;

  return (
    <div className="landing">
      <header className="landing__nav">
        <div className="landing__nav-inner">
          <div className="landing__brand">Zongo Supermarket</div>
          <nav className="landing__nav-links">
            <a href="#products">Products</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="landing__nav-actions">
            <Link to="/login" className="landing__btn landing__btn--ghost">Sign In</Link>
            <Link to="/register" className="landing__btn landing__btn--primary">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-inner">
          <div className="landing__hero-content">
            <span className="landing__kicker">Est. wholesale distributor since 1990 &mdash; Kumasi</span>
            <h1>The shelves of Kumasi stay stocked because we show up.</h1>
            <p>
              Zongo Supermarket moves Coca-Cola products — classic bottles, PET crates and
              cans — from our warehouse to your shop floor, on schedule, every week.
            </p>
            <div className="landing__hero-actions">
              <Link to="/register" className="landing__btn landing__btn--primary">Create a Business Account</Link>
              <a href="#products" className="landing__hero-link">See what we carry &rarr;</a>
            </div>
          </div>
          {(!failedImages.has('hero') || !failedImages.has('hero2')) && (
            <figure className="landing__hero-image">
              <div className="landing__hero-image-grid">
                {!failedImages.has('hero') && (
                  <div className="landing__hero-image-frame">
                    <img
                      src="/products/delivery.jpg"
                      alt="Zongo Supermarket delivery truck loaded with beverage crates"
                      onError={() => markFailed('hero')}
                    />
                  </div>
                )}
                {!failedImages.has('hero2') && (
                  <div className="landing__hero-image-frame">
                    <img
                      src="/products/delivery1.jpg"
                      alt="Zongo Supermarket delivery truck making a drop-off"
                      onError={() => markFailed('hero2')}
                    />
                  </div>
                )}
              </div>
              <figcaption>Fleet on the road across Kumasi, six days a week.</figcaption>
            </figure>
          )}
        </div>
      </section>

      <section className="landing__stats">
        {WHY_CHOOSE_US.map((item, i) => (
          <div className="landing__stat" key={item.title}>
            <span className="landing__stat-index">{String(i + 1).padStart(2, '0')}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </section>

      <section className="landing__section landing__section--dark" id="products">
        <div className="landing__section-head">
          <span className="landing__kicker landing__kicker--on-dark">01 &mdash; The range</span>
          <h2>What we distribute</h2>
        </div>
        <div className="product-shelf">
          {PRODUCTS.map((product) => (
            <div className="product-tile" key={product.name}>
              <div className="product-tile__image-wrap">
                {product.image && !failedImages.has(product.name) ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-tile__image"
                    onError={() => markFailed(product.name)}
                  />
                ) : (
                  <div
                    className={`product-icon${product.type === 'can' ? ' product-icon--can' : ''}`}
                    style={{ '--product-color': product.color }}
                  />
                )}
              </div>
              <div className="product-tile__body">
                <h3>{product.name}</h3>
                <p>{product.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__section" id="about">
        <div className="about-grid">
          <div className="about-grid__text">
            <span className="landing__kicker">02 &mdash; Who we are</span>
            <h2>Built on the routes we run, not a pitch deck.</h2>
            <p>
              Zongo Supermarket is a wholesale beverage distributor based in Kumasi, supplying
              Coca-Cola products to retail stores, restaurants, hotels, offices and event
              organisers across the region.
            </p>
            <p>
              Our focus is simple: keep your shelves stocked with accurate orders and dependable
              delivery, backed by a team that treats every customer — big or small — as a
              long-term partner.
            </p>
          </div>
          <div className="about-grid__collage" aria-hidden="true">
            <img src="/products/pet-1.5l.jpg" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <img src="/products/cans.jpg" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <img src="/products/club.jpg" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
        </div>
      </section>

      <section className="landing__section landing__section--muted">
        <div className="landing__section-head landing__section-head--center">
          <span className="landing__kicker">03 &mdash; Coverage</span>
          <h2>Who we serve</h2>
        </div>
        <p className="serve-list">
          {WHO_WE_SERVE.map((item, i) => (
            <span className="serve-list__item" key={item}>
              {item}
              {i < WHO_WE_SERVE.length - 1 && <span className="serve-list__sep" aria-hidden="true">/</span>}
            </span>
          ))}
        </p>
      </section>

      <section className="business-cta">
        <div className="business-cta__content">
          <span className="landing__kicker landing__kicker--on-dark">Order wholesale</span>
          <h2>Running a business? Order the easy way.</h2>
          <p>
            Create a business account to place orders, track sales and purchase history,
            and manage payments — all from your own dashboard.
          </p>
          <Link to="/register" className="landing__btn landing__btn--primary">Create a Business Account</Link>
        </div>
      </section>

      <section className="landing__section" id="testimonials">
        <div className="landing__section-head">
          <span className="landing__kicker">04 &mdash; From our customers</span>
          <h2>What our customers say</h2>
        </div>
        <div className="landing__testimonials">
          <blockquote className="testimonial-card testimonial-card--featured">
            <p>&ldquo;{featuredTestimonial.quote}&rdquo;</p>
            <footer>
              <strong>{featuredTestimonial.author}</strong>
              <span>{featuredTestimonial.role}</span>
            </footer>
          </blockquote>
          <div className="landing__testimonials-side">
            {otherTestimonials.map((t) => (
              <blockquote className="testimonial-card" key={t.author}>
                <p>&ldquo;{t.quote}&rdquo;</p>
                <footer>
                  <strong>{t.author}</strong>
                  <span>{t.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing__footer" id="contact">
        <div className="landing__footer-grid">
          <div className="landing__footer-brand">
            <div className="landing__brand">Zongo Supermarket</div>
            <p>Wholesale beverage distribution. Sign in or create an account to place and track orders.</p>
          </div>
          <dl className="landing__footer-contact">
            <div>
              <dt>Phone</dt>
              <dd>+233591077750</dd>
              <dd>+233247844871</dd>
            </div>
            <div><dt>Email</dt><dd>support@zongosupermarket.com</dd></div>
            <div><dt>Location</dt><dd>Kumasi, Ghana</dd></div>
          </dl>
        </div>
        <p className="landing__footer-copyright">&copy; {new Date().getFullYear()} Zongo Supermarket. All rights reserved.</p>
      </footer>
    </div>
  );
}
