"use client";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Instagram, Sparkles, ArrowUpRight } from "lucide-react";
import { FloatingDock } from "../ui/floating-dock";

const footerLinks = {
  platform: {
    title: "PLATFORM",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Story Pipeline", href: "#" },
      { label: "Code Editor", href: "#" },
      { label: "Live Preview", href: "#" },
    ],
  },
  agents: {
    title: "AI AGENTS",
    links: [
      { label: "Task Divider", href: "#" },
      { label: "Code Generator", href: "#" },
      { label: "Code Reviewer", href: "#" },
      { label: "Test Executor", href: "#" },
    ],
  },
  useCases: {
    title: "USE CASES",
    links: [
      { label: "User Story to Code", href: "#" },
      { label: "Full-Stack Apps", href: "#" },
      { label: "Automated Testing", href: "#" },
      { label: "GitHub Integration", href: "#" },
    ],
  },
  resources: {
    title: "RESOURCES",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Architecture", href: "#" },
    ],
  },
  company: {
    title: "COMPANY",
    links: [
      { label: "About", href: "#" },
      { label: "Team", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
};

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Github, href: "https://github.com/akshatarora130/AutoDev", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

const legalLinks = [
  { label: "Security", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Cookie Policy", href: "#" },
];

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) => (
  <div>
    <h4 className="text-xs font-bold tracking-widest uppercase text-accent-primary mb-4">
      {title}
    </h4>
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            className="text-sm text-text-muted hover:text-white transition-colors duration-200 flex items-center gap-1 group"
          >
            {link.label}
            <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-50 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-200" />
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export const Footer = () => {
  return (
    <footer className="relative bg-black border-t border-white/5 overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Top gradient line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Main Footer Content */}
        {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 mb-16"> */}
        {/* Brand Column */}
        {/* <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <motion.a
              href="/"
              whileHover={{ scale: 1.02 }}
              className="inline-flex items-center gap-2 mb-4 group"
            >
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-accent-primary/20 blur-lg rounded-full group-hover:opacity-100 opacity-50 transition-opacity duration-300" />
                <img
                  src="/Logo.png"
                  alt="AutoDev Logo"
                  className="w-8 h-8 object-contain relative z-10 group-hover:rotate-12 transition-transform duration-500"
                />
              </div>
              <span className="font-bold text-xl text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent-primary group-hover:to-accent-secondary transition-all duration-300">AutoDev</span>
            </motion.a>
            <p className="text-sm text-text-muted leading-relaxed mb-4 max-w-xs">
              Multi-agent development automation platform. Transform user stories into production-ready code.
            </p>
            <p className="text-xs text-text-muted/60">
              Built by <span className="text-accent-primary">Binary Pheonix</span>
            </p>
          </div> */}

        {/* Link Columns */}
        {/* <FooterColumn {...footerLinks.platform} />
          <FooterColumn {...footerLinks.agents} />
          <FooterColumn {...footerLinks.useCases} />
          <FooterColumn {...footerLinks.resources} />
          <FooterColumn {...footerLinks.company} /> */}
        {/* </div> */}

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright & Legal */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-sm text-text-muted">© 2025 AutoDev Platform. All rights reserved.</p>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-4">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs text-text-muted hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Social Links */}

          <div className="flex items-center gap-3">
            <FloatingDock
              items={socialLinks.map((link) => ({
                title: link.label,
                icon: <link.icon className="h-full w-full text-neutral-300" />,
                href: link.href,
              }))}
              desktopClassName="bg-transparent border-none"
            />
          </div>
        </div>

        {/* Team Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-white/5">
            <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
            <span className="text-xs text-text-muted">
              Techfest 2025–26 • Team ID:{" "}
              <span className="text-white font-medium">Auto-250366</span>
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
