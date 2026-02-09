'use client';

import { useCallback, useState } from 'react';
import { RetroDialog } from '@/components/retro-dialog';
import { Badge } from '@/components/ui/badge';
import type { CvParsedData } from '@/lib/ai/schemas';

interface ParsedProfileViewerProps {
  documentId: string;
  trigger: React.ReactNode;
}

interface ParsedProfileData {
  id: string;
  parsedData: CvParsedData;
  confidenceScore: string | null;
  createdAt: string;
}

export function ParsedProfileViewer({
  documentId,
  trigger,
}: ParsedProfileViewerProps) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ParsedProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (newOpen && !profile) {
        setLoading(true);
        fetch(`/api/ai/parse-cv/${documentId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data: ParsedProfileData | null) => {
            setProfile(data);
            setLoading(false);
          })
          .catch(() => {
            setLoading(false);
          });
      }
    },
    [documentId, profile],
  );

  const data = profile?.parsedData;

  return (
    <RetroDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title="Parsed CV Profile"
      description={
        profile?.confidenceScore
          ? `Confidence: ${(parseFloat(profile.confidenceScore) * 100).toFixed(0)}%`
          : undefined
      }
      className="max-h-[80vh] max-w-2xl overflow-y-auto"
    >
      {loading && (
        <p className="font-body text-muted-foreground text-sm">Loading...</p>
      )}
      {!loading && !data && (
        <p className="font-body text-muted-foreground text-sm">
          No parsed profile found.
        </p>
      )}
      {data && (
        <div className="space-y-4">
          {/* Contact */}
          {(data.name || data.email || data.phone || data.location) && (
            <Section title="Contact">
              {data.name && (
                <p className="font-body text-sm font-medium">{data.name}</p>
              )}
              <div className="font-body text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                {data.email && <span>{data.email}</span>}
                {data.phone && <span>{data.phone}</span>}
                {data.location && <span>{data.location}</span>}
              </div>
              <div className="font-body text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                {data.linkedin && <span>{data.linkedin}</span>}
                {data.website && <span>{data.website}</span>}
              </div>
            </Section>
          )}

          {/* Summary */}
          {data.summary && (
            <Section title="Summary">
              <p className="font-body text-muted-foreground text-sm">
                {data.summary}
              </p>
            </Section>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <Section title="Skills">
              <div className="flex flex-wrap gap-1">
                {data.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {/* Experience */}
          {data.experience.length > 0 && (
            <Section title="Experience">
              <div className="space-y-3">
                {data.experience.map((exp, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="font-body text-sm font-medium">
                      {exp.title}
                      <span className="text-muted-foreground font-normal">
                        {' '}
                        at {exp.company}
                      </span>
                    </p>
                    <p className="font-body text-muted-foreground text-xs">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="font-body text-muted-foreground text-xs">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <Section title="Education">
              <div className="space-y-2">
                {data.education.map((edu, i) => (
                  <div key={i}>
                    <p className="font-body text-sm font-medium">
                      {edu.degree}
                      {edu.field && ` in ${edu.field}`}
                    </p>
                    <p className="font-body text-muted-foreground text-xs">
                      {edu.institution}
                      {edu.endDate && ` (${edu.endDate})`}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <Section title="Certifications">
              <div className="space-y-1">
                {data.certifications.map((cert, i) => (
                  <p key={i} className="font-body text-sm">
                    {cert.name}
                    {cert.issuer && (
                      <span className="text-muted-foreground">
                        {' '}
                        - {cert.issuer}
                      </span>
                    )}
                  </p>
                ))}
              </div>
            </Section>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <Section title="Languages">
              <div className="flex flex-wrap gap-1">
                {data.languages.map((lang) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </RetroDialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <h3 className="font-heading text-primary text-sm">{title}</h3>
      {children}
    </div>
  );
}
