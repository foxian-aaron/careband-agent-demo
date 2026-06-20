import type { ContactPerson } from "../../types";

interface CareTeamCardProps {
  primaryCaregiver?: ContactPerson;
  backupCaregiver?: ContactPerson;
  familyContact?: ContactPerson;
  emergencyContact?: ContactPerson;
}

const ContactLine = ({
  label,
  contact,
}: {
  label: string;
  contact?: ContactPerson;
}) => (
  <div>
    <span>{label}</span>
    <strong>{contact?.name ?? "未指定"}</strong>
    <p>
      {contact?.relation ? `${contact.relation} · ` : ""}
      {contact?.phoneMasked ?? "-"}
    </p>
  </div>
);

export const CareTeamCard = ({
  primaryCaregiver,
  backupCaregiver,
  familyContact,
  emergencyContact,
}: CareTeamCardProps) => (
  <article className="panel">
    <div className="section-title">
      <span>照护团队</span>
      <h2>联系人与职责</h2>
    </div>
    <div className="info-grid compact">
      <ContactLine label="主责护工" contact={primaryCaregiver} />
      <ContactLine label="备用护工" contact={backupCaregiver} />
      <ContactLine label="家属联系人" contact={familyContact} />
      <ContactLine label="紧急联系人" contact={emergencyContact} />
    </div>
  </article>
);
