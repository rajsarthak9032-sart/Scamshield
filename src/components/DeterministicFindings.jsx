import {
  Timer,
  Lock,
  KeyRound,
  CreditCard,
  Gift,
  Bitcoin,
  User,
  Trophy,
  Briefcase,
  Package,
  UserCheck,
  Users,
  Mail,
  Phone,
  Link as LinkIcon,
  Link2,
  Search,
} from "lucide-react";

const ICONS = {
  urgency_language: Timer,
  threat_closure: Lock,
  credential_request: KeyRound,
  verification_code: KeyRound,
  payment_request: CreditCard,
  gift_card: Gift,
  crypto_request: Bitcoin,
  personal_info: User,
  prize_language: Trophy,
  job_offer: Briefcase,
  delivery_language: Package,
  impersonation: UserCheck,
  social_engineering: Users,
  email_address: Mail,
  phone_number: Phone,
  suspicious_link: LinkIcon,
  shortened_url: Link2,
};

export default function DeterministicFindings({ findings }) {
  const list = findings || [];
  return (
    <div className="panel panel-pad">
      <div className="card-title">
        <Search size={18} className="ico" /> Pattern checks
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
        These come from lightweight rule-based checks that run alongside the AI analysis. They are
        signals, not verdicts.
      </p>
      {list.length === 0 ? (
        <p className="muted">No rule-based patterns were triggered.</p>
      ) : (
        <div className="find-list">
          {list.map((f, i) => {
            const Icon = ICONS[f.type] || Search;
            return (
              <div className="find" key={i}>
                <span className="find-ico">
                  <Icon size={16} />
                </span>
                <div className="find-body">
                  <div className="fname">{f.name}</div>
                  {f.evidence ? (
                    <div className="fev">Evidence: “{f.evidence}”</div>
                  ) : null}
                  <div className="fdesc">{f.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
