import {
  ArrowUpRight,
  Code2,
  Github,
  Globe2,
  Layers3,
  MapPin,
  RadioTower,
  Sparkles,
  TerminalSquare,
} from 'lucide-react'
import type { CSSProperties } from 'react'

const projects = [
  {
    name: 'RialoTempleAgent',
    description: 'Latest TypeScript build around ritualized agent experiences and onchain identity.',
    language: 'TypeScript',
    url: 'https://github.com/nxrskyaa/RialoTempleAgent',
    accent: '#63f7a6',
  },
  {
    name: 'arcynite',
    description: 'Colorful Arc Testnet onboarding game MVP with a playful learning loop.',
    language: 'TypeScript',
    url: 'https://github.com/nxrskyaa/arcynite',
    accent: '#78ecff',
  },
  {
    name: 'siggy-scroll-galaxy',
    description: 'Galaxy magical theme with a chibi Tamagotchi-style mascot for Siggy Scroll.',
    language: 'TypeScript',
    url: 'https://github.com/nxrskyaa/siggy-scroll-galaxy',
    accent: '#c886ff',
  },
  {
    name: 'ritual-agent-feeds',
    description: 'Ritual Agent Terminal for onchain message feeds on Ritual Testnet.',
    language: 'TypeScript',
    url: 'https://github.com/nxrskyaa/ritual-agent-feeds',
    accent: '#ffe45e',
  },
  {
    name: 'tennis-rally-arc',
    description: 'Cute arcade tennis on Arc Testnet with onchain profiles and score submissions.',
    language: 'TypeScript',
    url: 'https://github.com/nxrskyaa/tennis-rally-arc',
    accent: '#ff7ad9',
  },
  {
    name: 'CVGEN',
    description: 'Web3 CV generator by NXR, built as a fast TypeScript utility.',
    language: 'TypeScript',
    url: 'https://github.com/nxrskyaa/CVGEN',
    accent: '#ffad72',
  },
]

const services = [
  {
    icon: <Layers3 size={24} />,
    title: 'Onchain Games',
    meta: 'Arc + Ritual testnet loops',
    copy: 'Tiny worlds, score systems, profile flows, and playful onboarding that make testnet actions feel alive.',
  },
  {
    icon: <RadioTower size={24} />,
    title: 'Agentic Feeds',
    meta: 'Terminals + message streams',
    copy: 'Realtime-feeling interfaces for agent activity, community rituals, and onchain feed experiments.',
  },
  {
    icon: <TerminalSquare size={24} />,
    title: 'Web3 Utilities',
    meta: 'Dashboards + generators',
    copy: 'Useful tools for crypto users: screeners, CV builders, explorers, and profile surfaces.',
  },
]

const repoStats = [
  ['20', 'public repos'],
  ['2013', 'GitHub since'],
  ['Bali', 'builder base'],
  ['TS', 'primary stack'],
]

const tech = ['React', 'TypeScript', 'Vite', 'Wagmi', 'Viem', 'Tailwind', 'Ritual', 'Arc Testnet']

export default function App() {
  return (
    <main className="portfolio-site">
      <nav className="portfolio-nav" aria-label="Primary navigation">
        <a className="portfolio-brand" href="#top" aria-label="NXR home">
          NXR
        </a>
        <div className="portfolio-links">
          <a href="#services">Services</a>
          <a href="#portfolio">Portfolio</a>
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
        </div>
        <a className="portfolio-contact" href="https://github.com/nxrskyaa" target="_blank" rel="noreferrer">
          <Github size={18} />
          GitHub
        </a>
      </nav>

      <section id="top" className="portfolio-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="hero-handle">@nxrskyaa</p>
          <h1 id="hero-title">NXR builds playful onchain apps</h1>
          <div className="hero-rule" />
          <p>
            Bali-based Web3 builder shipping TypeScript experiments across Ritual, Arc, agent feeds,
            onchain games, dashboards, and profile tools.
          </p>
          <div className="hero-actions">
            <a href="#projects" className="primary-action">
              View projects
              <ArrowUpRight size={18} />
            </a>
            <a href="https://github.com/nxrskyaa" target="_blank" rel="noreferrer" className="secondary-action">
              Open GitHub
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-label="NXR profile visual">
          <div className="orbit-line orbit-one" />
          <div className="orbit-line orbit-two" />
          <div className="avatar-mark" aria-label="NXR profile mark">
            <span>NXR</span>
            <small>onchain builder</small>
          </div>
          <div className="floating-stat stat-top">
            <span>20</span>
            Public repos
          </div>
          <div className="floating-stat stat-left">
            <span>2013</span>
            GitHub era
          </div>
          <div className="floating-stat stat-right">
            <span>0x</span>
            Web3 native
          </div>
        </div>

        <div className="hero-meta" aria-label="Profile stats">
          {repoStats.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="portfolio-section service-section" aria-labelledby="services-title">
        <div className="section-heading">
          <h2 id="services-title">Mobile and website systems that are already in motion</h2>
          <p>
            The public repo trail points to a builder who likes fast prototypes, game-like surfaces,
            and practical crypto tools.
          </p>
        </div>
        <div className="service-list">
          {services.map((service) => (
            <article className="service-row" key={service.title}>
              <div className="service-icon">{service.icon}</div>
              <div>
                <h3>{service.title}</h3>
                <span>{service.meta}</span>
              </div>
              <p>{service.copy}</p>
              <ArrowUpRight className="service-arrow" size={28} />
            </article>
          ))}
        </div>
      </section>

      <section id="portfolio" className="portfolio-band" aria-labelledby="portfolio-title">
        <div>
          <h2 id="portfolio-title">A Web3 portfolio with an arcade pulse</h2>
          <p>
            Ritual testnet dapps, Arc onboarding, agent feeds, screeners, profile cards, and tiny games
            sit in one clear personal identity: NXR, TypeScript first, ship fast.
          </p>
        </div>
        <div className="tech-rail" aria-label="Technology stack">
          {tech.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section id="projects" className="portfolio-section projects-section" aria-labelledby="projects-title">
        <div className="section-heading">
          <h2 id="projects-title">Selected public builds</h2>
          <p>Pulled from the latest public repositories on github.com/nxrskyaa.</p>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <a
              className="project-card"
              href={project.url}
              target="_blank"
              rel="noreferrer"
              key={project.name}
              style={{ '--accent': project.accent } as CSSProperties}
            >
              <div className="project-thumbnail">
                <Code2 size={30} />
                <span>{project.language}</span>
              </div>
              <div>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
              </div>
              <ArrowUpRight size={24} />
            </a>
          ))}
        </div>
      </section>

      <section id="about" className="about-section" aria-labelledby="about-title">
        <div className="about-card">
          <Sparkles size={30} />
          <h2 id="about-title">NXR</h2>
          <p>
            Public bio says it simply: NXR. The work says more: experimental interfaces, crypto-native
            play, fast frontend craft, and a clear taste for making testnet actions feel less dry.
          </p>
        </div>
        <div className="about-links">
          <a href="https://github.com/nxrskyaa" target="_blank" rel="noreferrer">
            <Github size={20} />
            github.com/nxrskyaa
          </a>
          <a href="https://x.com/nxrksyaa" target="_blank" rel="noreferrer">
            <Globe2 size={20} />
            x.com/nxrksyaa
          </a>
          <span>
            <MapPin size={20} />
            Bali, Indonesia
          </span>
        </div>
      </section>
    </main>
  )
}
