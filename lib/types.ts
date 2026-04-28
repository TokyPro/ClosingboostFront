// Types partagés alignés sur les schémas Pydantic du backend

export interface Opportunity {
  id: string;
  title: string;
  company_name: string;
  stage: 'creation' | 'qualification' | 'first_meeting' | 'quote_needed' | 'offer_sent' | 'waiting_signature' | 'signed';
  value: number;
  win_probability: number;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface Briefing {
  id: string;
  opportunity_id: string;
  ai_strategy: string;
  ai_risk_assessment: string;
  market_insights: Record<string, string>;
  buyer_persona?: string | null;
  value_prop_alignment?: string | null;
}

export interface Interaction {
  id: string;
  opportunity_id: string;
  type: string;
  summary?: string | null;
  raw_transcript?: string | null;
  requirements?: Record<string, string | null> | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export interface LeadResult {
  id: string;
  name: string | null;
  job_title: string | null;
  company: string | null;
  location: string | null;
  url: string;
  summary: string | null;
  source: string;
  relevance_score: number;
  avatar_initials: string;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface LeadSearchResponse {
  leads: LeadResult[];
  total: number;
  query_used: string;
  demo_mode: boolean;
  ai_response: string | null;
}

export interface LeadRecord {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  contact_title: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  activity_sector: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  location: string | null;
  summary: string | null;
  source: string;
  relevance_score: number;
  status: string;
  notes: string | null;
  search_query: string | null;
  search_location: string | null;
  created_at: string;
  updated_at: string;
  opportunity_id: string | null;
  // Scoring workflow
  score: number;
  tier: 'cold' | 'warm' | 'hot';
  fit_score: number;
  intent_score: number;
  score_updated_at: string | null;
  outreach_attempts: number;
  last_outreach_at: string | null;
  email_verified: boolean;
  email_status: string;
  // Enrichment
  company_news: string[] | null;
  enriched_at: string | null;
}

export interface LeadsListResponse {
  leads: LeadRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadScoring {
  score: number;
  tier: 'cold' | 'warm' | 'hot';
  fit_score: number;
  intent_score: number;
  score_updated_at: string | null;
  outreach_attempts: number;
  last_outreach_at: string | null;
  email_verified: boolean;
  email_status: string;
  company_news: string[] | null;
  enriched_at: string | null;
}

export interface ScoringConfig {
  id: string;
  warm_threshold: number;
  hot_threshold: number;
  fit_weight: number;
  intent_weight: number;
  click_score_boost: number;
  reply_score_boost: number;
  webinar_score_boost: number;
  meeting_score_boost: number;
  max_hot_attempts: number;
  cooldown_score_penalty: number;
  updated_at: string;
}

export interface OutreachMessage {
  id: string;
  lead_id: string;
  tier: string;
  channel: string;
  subject: string | null;
  message_content: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  score_before: number | null;
  score_after: number | null;
  created_at: string;
}

export interface ScoreEvent {
  id: string;
  lead_id: string;
  event_type: string;
  score_delta: number;
  score_before: number | null;
  score_after: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PipelineStats {
  cold_count: number;
  warm_count: number;
  hot_count: number;
  total: number;
  cold_pct: number;
  warm_pct: number;
  hot_pct: number;
}

export interface AgentRecommendation {
  lead_id: string;
  tier: string;
  agent_name: string;
  recommended_action: string;
  current_score: number;
  outreach_attempts: number;
}

export interface AgentRunResult {
  lead_id: string;
  tier: string;
  agent_name: string;
  action: string;
  channel: string;
  subject: string | null;
  message_content: string;
  rationale: string;
  message_id: string;
}
