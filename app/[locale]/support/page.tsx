'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sidebar } from '../../../components/Sidebar';
import { TopBar } from '../../../components/TopBar';
import { cn } from '../../../lib/cn';

// ── Content data (locale-aware) ───────────────────────────────────────────────

interface Step { icon: string; title: string; desc: string; }
interface HelpSection { id: string; icon: string; color: string; title: string; subtitle: string; steps: Step[]; tips?: string[]; }
interface FaqItem { q: string; a: string; }

const SECTIONS_FR: HelpSection[] = [
  {
    id: 'getting-started', icon: 'rocket_launch', color: 'text-primary',
    title: 'Démarrage rapide',
    subtitle: 'Bienvenue sur SalesBoost AI — votre plateforme d\'intelligence commerciale propulsée par l\'IA.',
    steps: [
      { icon: 'sidebar', title: 'Naviguer dans l\'application', desc: 'La barre latérale gauche donne accès à toutes les sections : Tableau de bord, Opportunités, Copilote IA et Administration. L\'icône active est mise en surbrillance.' },
      { icon: 'dark_mode', title: 'Changer de thème', desc: 'Basculez entre le mode clair et le mode sombre en cliquant sur l\'icône soleil/lune dans la barre supérieure. Votre préférence est sauvegardée automatiquement.' },
      { icon: 'language', title: 'Changer de langue', desc: 'Cliquez sur le sélecteur de langue (FR / EN) dans la barre supérieure pour passer du français à l\'anglais.' },
      { icon: 'search', title: 'Rechercher une opportunité', desc: 'Utilisez la barre de recherche en haut pour retrouver instantanément une opportunité par nom ou entreprise. Appuyez sur Entrée pour lancer la recherche.' },
    ],
    tips: ['Commencez par créer votre première opportunité depuis la section Opportunités ou le bouton « Nouvelle opportunité » du tableau de bord.'],
  },
  {
    id: 'dashboard', icon: 'dashboard', color: 'text-on-tertiary-container',
    title: 'Tableau de bord',
    subtitle: 'Vue d\'ensemble en temps réel de votre pipeline commercial avec indicateurs clés et analyse IA.',
    steps: [
      { icon: 'analytics', title: 'Métriques clés', desc: 'Trois cartes résument votre pipeline : Valeur totale du pipeline, Taux de conversion (opportunités fermées / total) et Probabilité de gain moyenne pondérée sur tous vos deals.' },
      { icon: 'view_kanban', title: 'Pipeline Kanban', desc: 'Le pipeline affiche vos opportunités en 4 colonnes : Découverte → Proposition → Négociation → Clôturé. Chaque carte affiche le titre, la valeur, la priorité et la probabilité de gain.' },
      { icon: 'insights', title: 'Vue dirigeant', desc: 'Le panneau droit affiche la progression vers vos objectifs (% de la valeur pipeline clôturée) et un résumé de l\'équipe commerciale assignée.' },
      { icon: 'add_circle', title: 'Créer une opportunité', desc: 'Le bouton « Nouvelle opportunité » en haut à droite ouvre le formulaire de création. Après création, vous pouvez générer un briefing IA ou approfondir avec le Copilote.' },
    ],
    tips: ['La barre de progression « Goal Progress » reflète automatiquement le % de valeur pipeline réellement clôturée.'],
  },
  {
    id: 'opportunities', icon: 'monetization_on', color: 'text-on-primary-container',
    title: 'Gestion des opportunités',
    subtitle: 'Gérez votre pipeline en vue Kanban ou en vue Tableau, avec pagination et filtres.',
    steps: [
      { icon: 'view_kanban', title: 'Vue Kanban', desc: 'La vue par défaut. Les opportunités sont organisées en colonnes par étape (Découverte, Proposition, Négociation, Clôturé). Cliquez sur une carte pour accéder au briefing.' },
      { icon: 'table_rows', title: 'Vue Tableau', desc: 'Basculez en vue tableau via le sélecteur Kanban / Tableau en haut à droite. Les colonnes affichent : entreprise, titre, étape, valeur, probabilité (barre de progression), priorité, date de création et actions.' },
      { icon: 'pages', title: 'Pagination', desc: 'En vue tableau, les opportunités sont paginées par 10. Utilisez les boutons Préc. / Suiv. ou cliquez directement sur un numéro de page. Le compteur affiche la plage visible (ex : 1–10 sur 24).' },
      { icon: 'edit', title: 'Modifier / Supprimer', desc: 'Depuis la page briefing d\'une opportunité, les boutons Modifier et Supprimer sont disponibles. La suppression demande une confirmation. La modification met à jour le titre, l\'entreprise, la valeur, la probabilité et la priorité.' },
    ],
    tips: ['Les URLs incluent le paramètre vue (?view=table) et la page (?page=2) — vous pouvez partager ou mémoriser l\'URL pour retrouver votre contexte.'],
  },
  {
    id: 'copilot', icon: 'smart_toy', color: 'text-tertiary',
    title: 'Copilote IA',
    subtitle: 'Assistant de recueil de besoins client : posez les bonnes questions, capturez les exigences, générez un chiffrage.',
    steps: [
      { icon: 'chat', title: 'Conversation guidée', desc: 'Le Copilote pose 8 questions structurées (description, plateforme, fonctionnalités, hébergement, volumétrie, utilisateurs, délai, intégrations) puis 3 questions de suivi (contraintes, techno, contexte). Le chat reste ouvert ensuite pour toute question complémentaire.' },
      { icon: 'touch_app', title: 'Suggestions multi-sélection', desc: 'Sous chaque message IA, des suggestions apparaissent sous forme de chips. Cliquez sur une ou plusieurs chips pour les sélectionner (elles deviennent bleues avec une coche). Ajoutez du texte libre si besoin, puis appuyez sur Envoyer.' },
      { icon: 'history', title: 'Sessions passées', desc: 'Sélectionnez une opportunité dans le menu déroulant. Le badge historique (icône horloge) affiche le nombre de sessions sauvegardées. Cliquez dessus pour charger une session précédente et reprendre là où vous en étiez.' },
      { icon: 'save', title: 'Sauvegarder la visite', desc: 'Associez une opportunité et optionnellement une campagne via les sélecteurs en haut. Le bouton « Enregistrer la visite » dans le panneau des besoins enregistre toute la conversation et les besoins en base.' },
      { icon: 'description', title: 'Synthèse des besoins', desc: 'Le panneau droit affiche en temps réel les besoins extraits automatiquement par l\'IA. Chaque champ est éditable — cliquez dessus pour modifier la valeur. Un badge « AI » indique les champs remplis automatiquement.' },
      { icon: 'add_box', title: 'Champs personnalisés', desc: 'En bas du panneau des besoins, le bouton « Ajouter un besoin » permet d\'ajouter des champs libres (ex : Budget, Contrainte légale). Ces champs sont inclus dans le chiffrage et le briefing.' },
    ],
    tips: [
      'Depuis la page création d\'opportunité, le bouton « Approfondir avec le Copilote » pré-remplit automatiquement l\'opportunité et la description dans le Copilote.',
      'Utilisez le bouton « Nouvelle conversation » pour repartir à zéro. Une confirmation est demandée si des données non sauvegardées sont présentes.',
    ],
  },
  {
    id: 'briefings', icon: 'description', color: 'text-on-tertiary-container',
    title: 'Briefings & Chiffrages',
    subtitle: 'Générez des analyses stratégiques IA et des estimations de projet directement depuis le Copilote ou la page opportunité.',
    steps: [
      { icon: 'auto_awesome', title: 'Générer un briefing', desc: 'Une fois les besoins recueillis dans le Copilote, cliquez sur « Générer le Briefing ». Un formulaire vous demande le titre de l\'opportunité, le nom de l\'entreprise cliente et la valeur estimée. L\'IA génère alors une analyse stratégique complète.' },
      { icon: 'psychology', title: 'Contenu du briefing', desc: 'Le briefing contient : une stratégie pilotée par l\'IA (angle de vente), une évaluation des risques (dette technique, délais), une intelligence marché (indice de demande, croissance régionale, budget) et une suggestion de playbook.' },
      { icon: 'calculate', title: 'Chiffrage projet', desc: 'Le bouton « Générer un chiffrage » (icône calculatrice) dans le Copilote ou la barre supérieure génère une estimation détaillée : coût total, durée en jours, taux journalier, phases du projet avec coûts individuels et hypothèses de calcul.' },
      { icon: 'edit_note', title: 'Modifier l\'opportunité', desc: 'Depuis la page briefing, le bouton Modifier permet d\'éditer tous les champs de l\'opportunité (titre, entreprise, valeur, probabilité, priorité). Les modifications sont sauvegardées et le briefing peut être régénéré.' },
    ],
    tips: ['Le briefing est généré par Gemini 2.5 Flash via Google File Search — il s\'appuie sur la méthodologie interne et le profil public de l\'entreprise cliente.'],
  },
  {
    id: 'admin', icon: 'settings', color: 'text-on-surface-variant',
    title: 'Administration',
    subtitle: 'Gérez les utilisateurs, la base de connaissances RAG et consultez les analytics IA.',
    steps: [
      { icon: 'group', title: 'Gestion des utilisateurs', desc: 'L\'onglet Utilisateurs liste tous les comptes. Créez un utilisateur via « Ajouter un utilisateur » (email, mot de passe, rôle : Exécutif / Manager / Administrateur). Modifiez ou supprimez depuis les boutons d\'action de chaque ligne.' },
      { icon: 'database', title: 'Base de connaissances', desc: 'L\'onglet Base de connaissances gère les documents indexés dans le système RAG (Retrieval-Augmented Generation). Téléchargez de nouvelles sources, ré-indexez les documents existants ou supprimez les sources obsolètes.' },
      { icon: 'sync', title: 'Ré-indexation', desc: 'Le bouton « Ré-indexer tout » relance l\'indexation vectorielle de tous les documents. Le statut « Synchronisé » / « Indexation... » indique l\'état de chaque document. Le badge de statut RAG en haut indique la santé globale.' },
      { icon: 'bar_chart', title: 'Analytics IA', desc: 'Le panneau Analytics affiche l\'indice de demande marché et le risque de churn (faible/moyen/élevé) basés sur l\'analyse IA de votre pipeline. Ces indicateurs guident la priorisation des actions commerciales.' },
    ],
    tips: ['Seuls les utilisateurs avec le rôle Administrateur ont accès à la console Admin.'],
  },
];

const SECTIONS_EN: HelpSection[] = [
  {
    id: 'getting-started', icon: 'rocket_launch', color: 'text-primary',
    title: 'Quick Start',
    subtitle: 'Welcome to SalesBoost AI — your AI-powered sales intelligence platform.',
    steps: [
      { icon: 'sidebar', title: 'Navigate the app', desc: 'The left sidebar gives access to all sections: Dashboard, Opportunities, AI Copilot and Administration. The active icon is highlighted.' },
      { icon: 'dark_mode', title: 'Toggle dark/light mode', desc: 'Switch between light and dark mode by clicking the sun/moon icon in the top bar. Your preference is saved automatically.' },
      { icon: 'language', title: 'Switch language', desc: 'Click the language selector (FR / EN) in the top bar to switch between French and English.' },
      { icon: 'search', title: 'Search opportunities', desc: 'Use the search bar at the top to instantly find an opportunity by name or company. Press Enter to search.' },
    ],
    tips: ['Start by creating your first opportunity from the Opportunities section or the "New Opportunity" button on the dashboard.'],
  },
  {
    id: 'dashboard', icon: 'dashboard', color: 'text-on-tertiary-container',
    title: 'Dashboard',
    subtitle: 'Real-time overview of your sales pipeline with key metrics and AI analysis.',
    steps: [
      { icon: 'analytics', title: 'Key metrics', desc: 'Three cards summarize your pipeline: Total Pipeline Value, Conversion Rate (closed / total) and Average Win Probability across all deals.' },
      { icon: 'view_kanban', title: 'Kanban pipeline', desc: 'The pipeline shows your opportunities in 4 columns: Discovery → Proposal → Negotiation → Closed. Each card shows the title, value, priority and win probability.' },
      { icon: 'insights', title: 'Executive overview', desc: 'The right panel shows goal progress (% of pipeline value actually closed) and an assigned sales team summary.' },
      { icon: 'add_circle', title: 'Create an opportunity', desc: 'The "New Opportunity" button opens the creation form. After creation, you can generate an AI briefing or go deeper with the Copilot.' },
    ],
    tips: ['The "Goal Progress" bar automatically reflects the % of pipeline value that is actually closed.'],
  },
  {
    id: 'opportunities', icon: 'monetization_on', color: 'text-on-primary-container',
    title: 'Opportunities',
    subtitle: 'Manage your pipeline in Kanban or Table view, with pagination and filters.',
    steps: [
      { icon: 'view_kanban', title: 'Kanban view', desc: 'The default view. Opportunities are organized in columns by stage (Discovery, Proposal, Negotiation, Closed). Click a card to access its briefing.' },
      { icon: 'table_rows', title: 'Table view', desc: 'Switch to table view via the Kanban / Table toggle. Columns show: company, title, stage, value, win probability (progress bar), priority, creation date and actions.' },
      { icon: 'pages', title: 'Pagination', desc: 'In table view, opportunities are paginated by 10. Use Prev / Next buttons or click a page number. The counter shows the visible range (e.g. 1–10 of 24).' },
      { icon: 'edit', title: 'Edit / Delete', desc: 'From an opportunity\'s briefing page, Edit and Delete buttons are available. Deletion requires confirmation. Editing updates the title, company, value, probability and priority.' },
    ],
    tips: ['URLs include view (?view=table) and page (?page=2) — share or bookmark the URL to restore your exact context.'],
  },
  {
    id: 'copilot', icon: 'smart_toy', color: 'text-tertiary',
    title: 'AI Copilot',
    subtitle: 'Client requirements gathering assistant: ask the right questions, capture requirements, generate a quote.',
    steps: [
      { icon: 'chat', title: 'Guided conversation', desc: 'The Copilot asks 8 structured questions (description, platform, features, hosting, data volume, users, timeline, integrations) then 3 follow-ups (constraints, tech, context). Chat stays open afterwards for any further questions.' },
      { icon: 'touch_app', title: 'Multi-select suggestions', desc: 'Below each AI message, suggestions appear as chips. Click one or more chips to select them (they turn blue with a checkmark). Add free text if needed, then press Send.' },
      { icon: 'history', title: 'Past sessions', desc: 'Select an opportunity in the dropdown. The history badge shows the number of saved sessions. Click it to load a previous session and resume where you left off.' },
      { icon: 'save', title: 'Save the visit', desc: 'Associate an opportunity and optionally a campaign. The "Save Visit" button in the requirements panel saves the entire conversation and requirements to the database.' },
      { icon: 'description', title: 'Requirements summary', desc: 'The right panel displays requirements extracted in real time by the AI. Each field is editable — click it to modify the value. An "AI" badge marks auto-filled fields.' },
      { icon: 'add_box', title: 'Custom fields', desc: 'At the bottom of the requirements panel, "Add a requirement" lets you add free-form fields (e.g. Budget, Legal constraint). These fields are included in quotes and briefings.' },
    ],
    tips: [
      'From the opportunity creation page, "Go deeper with Copilot" automatically pre-fills the opportunity and description in the Copilot.',
      'Use "New Conversation" to start fresh. A confirmation is shown if unsaved data is present.',
    ],
  },
  {
    id: 'briefings', icon: 'description', color: 'text-on-tertiary-container',
    title: 'Briefings & Quotes',
    subtitle: 'Generate AI strategic analyses and project estimates directly from the Copilot or the opportunity page.',
    steps: [
      { icon: 'auto_awesome', title: 'Generate a briefing', desc: 'Once requirements are gathered in the Copilot, click "Generate Briefing". A form asks for the opportunity title, client company name and estimated value. The AI then generates a full strategic analysis.' },
      { icon: 'psychology', title: 'Briefing content', desc: 'The briefing contains: an AI-driven strategy (sales angle), a risk assessment (technical debt, delays), market intelligence (demand index, regional growth, budget) and a playbook suggestion.' },
      { icon: 'calculate', title: 'Project quote', desc: 'The "Generate Quote" button (calculator icon) generates a detailed estimate: total cost, duration in days, daily rate, project phases with individual costs and calculation assumptions.' },
      { icon: 'edit_note', title: 'Edit the opportunity', desc: 'From the briefing page, the Edit button lets you update all opportunity fields. Changes are saved immediately.' },
    ],
    tips: ['Briefings are generated by Gemini 2.5 Flash via Google File Search — leveraging internal sales methodology and the client\'s public profile.'],
  },
  {
    id: 'admin', icon: 'settings', color: 'text-on-surface-variant',
    title: 'Administration',
    subtitle: 'Manage users, the RAG knowledge base and view AI analytics.',
    steps: [
      { icon: 'group', title: 'User management', desc: 'The Users tab lists all accounts. Create a user via "Add User" (email, password, role: Executive / Manager / Admin). Edit or delete from action buttons on each row.' },
      { icon: 'database', title: 'Knowledge base', desc: 'The Knowledge Base tab manages documents indexed in the RAG system. Upload new sources, re-index existing documents or delete obsolete sources.' },
      { icon: 'sync', title: 'Re-indexing', desc: 'The "Re-index All" button re-runs vector indexing on all documents. The "Synced" / "Indexing..." status shows the state of each document.' },
      { icon: 'bar_chart', title: 'AI Analytics', desc: 'The Analytics panel shows the market demand index and churn risk (low/medium/high) based on AI analysis of your pipeline.' },
    ],
    tips: ['Only users with the Admin role have access to the Admin console.'],
  },
];

const FAQ_FR: FaqItem[] = [
  { q: 'Comment créer une opportunité depuis le Copilote ?', a: 'Dans le Copilote, après avoir recueilli les besoins, cliquez sur « Générer le Briefing ». La modal vous permet de créer une nouvelle opportunité en renseignant son titre, l\'entreprise et la valeur estimée.' },
  { q: 'Puis-je modifier les réponses extraites par l\'IA dans le Copilote ?', a: 'Oui. Dans le panneau « Synthèse des besoins » à droite, cliquez sur n\'importe quel champ pour l\'éditer. Une icône de crayon indique les champs modifiés manuellement, un badge « AI » les champs auto-remplis.' },
  { q: 'Comment charger une session précédente dans le Copilote ?', a: 'Sélectionnez une opportunité dans le menu déroulant en haut. Le badge historique affiche le nombre de sessions sauvegardées. Cliquez dessus pour voir la liste et charger une session.' },
  { q: 'Que contient le chiffrage généré ?', a: 'Le chiffrage contient : un titre de projet, un coût total estimé (€), une durée totale (jours), un taux journalier, la liste des phases du projet avec durée et coût individuels, et les hypothèses de calcul utilisées.' },
  { q: 'Comment fonctionne le mode sombre ?', a: 'Cliquez sur l\'icône lune (mode clair) ou soleil (mode sombre) dans la barre supérieure. La préférence est enregistrée dans localStorage. Le thème système est détecté automatiquement au premier chargement.' },
  { q: 'Puis-je exporter les données ?', a: 'Le bouton « Télécharger le rapport » est disponible sur la page opportunités. L\'export PDF du briefing est accessible depuis la page de briefing d\'une opportunité.' },
  { q: 'Qui peut accéder à l\'administration ?', a: 'Seuls les comptes avec le rôle Administrateur ont accès à la console Admin (gestion des utilisateurs, base de connaissances, analytics IA).' },
];

const FAQ_EN: FaqItem[] = [
  { q: 'How do I create an opportunity from the Copilot?', a: 'In the Copilot, after gathering requirements, click "Generate Briefing". The modal lets you create a new opportunity by entering its title, company and estimated value.' },
  { q: 'Can I edit the AI-extracted answers in the Copilot?', a: 'Yes. In the requirements summary panel on the right, click any field to edit it. A pencil icon indicates manually edited fields; an "AI" badge marks auto-filled fields.' },
  { q: 'How do I load a previous session in the Copilot?', a: 'Select an opportunity in the dropdown at the top. The history badge shows the number of saved sessions. Click it to see the list and load a session.' },
  { q: 'What does the generated quote contain?', a: 'The quote contains: a project title, total estimated cost (€), total duration (days), daily rate, list of project phases with individual duration and cost, and the calculation assumptions used.' },
  { q: 'How does dark mode work?', a: 'Click the moon icon (light mode) or sun icon (dark mode) in the top bar. Your preference is saved in localStorage. The system theme is detected automatically on first load.' },
  { q: 'Can I export data?', a: 'The "Download Report" button is available on the opportunities page. PDF export of the briefing is available from an opportunity\'s briefing page.' },
  { q: 'Who can access administration?', a: 'Only accounts with the Admin role have access to the Admin console (user management, knowledge base, AI analytics).' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const t = useTranslations('Support');
  const locale = useLocale();
  const sections = locale === 'fr' ? SECTIONS_FR : SECTIONS_EN;
  const faqs     = locale === 'fr' ? FAQ_FR : FAQ_EN;

  const [search, setSearch]         = useState('');
  const [activeId, setActiveId]     = useState('getting-started');
  const [openFaq, setOpenFaq]       = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'getting-started', labelKey: 'navGettingStarted', icon: 'rocket_launch' },
    { id: 'dashboard',       labelKey: 'navDashboard',      icon: 'dashboard' },
    { id: 'opportunities',   labelKey: 'navOpportunities',  icon: 'monetization_on' },
    { id: 'copilot',         labelKey: 'navCopilot',        icon: 'smart_toy' },
    { id: 'briefings',       labelKey: 'navBriefings',      icon: 'description' },
    { id: 'admin',           labelKey: 'navAdmin',          icon: 'settings' },
    { id: 'faq',             labelKey: 'navFaq',            icon: 'help' },
  ] as const;

  const query = search.toLowerCase().trim();
  const filteredSections = query
    ? sections.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.subtitle.toLowerCase().includes(query) ||
        s.steps.some(st => st.title.toLowerCase().includes(query) || st.desc.toLowerCase().includes(query))
      )
    : sections;

  const scrollTo = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(`section-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Update active section on scroll
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = () => {
      const all = [...sections.map(s => s.id), 'faq'];
      for (const id of [...all].reverse()) {
        const section = document.getElementById(`section-${id}`);
        if (section && section.getBoundingClientRect().top <= 120) {
          setActiveId(id);
          break;
        }
      }
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [sections]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        {/* Hero header */}
        <div className="bg-gradient-to-br from-primary to-primary-container px-8 py-8 shrink-0">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-on-primary/60 font-bold text-[10px] uppercase tracking-[0.3em] mb-3">
              <span className="w-4 h-0.5 bg-on-primary/40 rounded-full" />
              {t('title')}
            </div>
            <h1 className="font-headline font-black text-3xl text-on-primary tracking-tight mb-2">{t('subtitle')}</h1>
            <div className="relative mt-4 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-primary/40 text-[18px]">search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full bg-on-primary/10 text-on-primary placeholder:text-on-primary/40 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-on-primary/15 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-primary/40 hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Nav panel */}
          <nav className="hidden lg:flex flex-col w-56 shrink-0 bg-surface-container-low overflow-y-auto custom-scrollbar py-6 px-3 gap-0.5">
            {navItems.map(({ id, labelKey, icon }) => (
              <button
                key={id}
                onClick={() => { setSearch(''); scrollTo(id); }}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm transition-all w-full',
                  activeId === id
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
                )}
              >
                <span className={cn('material-symbols-outlined text-[18px]', activeId === id ? 'text-primary' : '')}
                  style={{ fontVariationSettings: activeId === id ? "'FILL' 1" : "'FILL' 0" }}>
                  {icon}
                </span>
                <span className="font-label tracking-tight">{t(labelKey)}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar">
            {query && filteredSections.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-4">search_off</span>
                <p className="text-on-surface-variant font-medium">{t('noResults', { query: search })}</p>
              </div>
            )}

            <div className="max-w-3xl px-8 py-8 space-y-16">
              {(query ? filteredSections : sections).map(section => (
                <div key={section.id} id={`section-${section.id}`}>
                  {/* Section header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-surface-container-low flex items-center justify-center shrink-0 mt-0.5">
                      <span className={cn('material-symbols-outlined text-[22px]', section.color)}
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        {section.icon}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-headline font-black text-2xl text-primary tracking-tight">{section.title}</h2>
                      <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">{section.subtitle}</p>
                    </div>
                  </div>

                  {/* Steps grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {section.steps.map((step, i) => (
                      <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 flex gap-4 items-start hover:bg-surface-container-low transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px] text-primary">{step.icon}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface mb-1">{step.title}</p>
                          <p className="text-[12px] text-on-surface-variant leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tips */}
                  {section.tips?.map((tip, i) => (
                    <div key={i} className="flex gap-3 bg-tertiary-container/15 rounded-xl px-4 py-3 mb-2">
                      <span className="material-symbols-outlined text-[16px] text-on-tertiary-container shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                      <p className="text-[12px] text-on-tertiary-container leading-relaxed">
                        <span className="font-bold uppercase tracking-widest text-[10px]">{t('tipLabel')} — </span>
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              ))}

              {/* FAQ */}
              {!query && (
                <div id="section-faq">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-surface-container-low flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
                    </div>
                    <div>
                      <h2 className="font-headline font-black text-2xl text-primary tracking-tight">{t('faqTitle')}</h2>
                      <p className="text-on-surface-variant text-sm mt-1">{t('faqSubtitle')}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {faqs.map((faq, i) => (
                      <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-container-low transition-colors"
                        >
                          <span className="font-bold text-sm text-on-surface pr-4">{faq.q}</span>
                          <span className={cn('material-symbols-outlined text-[20px] text-on-surface-variant shrink-0 transition-transform', openFaq === i ? 'rotate-180' : '')}>
                            expand_more
                          </span>
                        </button>
                        {openFaq === i && (
                          <div className="px-5 pb-5">
                            <p className="text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/10 pt-3">{faq.a}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to top */}
              {!query && (
                <div className="flex justify-center pb-8">
                  <button
                    onClick={() => { scrollTo('getting-started'); contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    {t('backToTop')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
