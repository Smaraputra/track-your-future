'use client';

import { Badge } from '@/components/ui/badge';
import type { JdExtractedData } from '@/lib/ai/schemas';

interface JdAnalysisViewerProps {
  data: JdExtractedData;
}

export function JdAnalysisViewer({ data }: JdAnalysisViewerProps) {
  return (
    <div className="space-y-4">
      {/* Company + Title + Location */}
      {(data.companyName || data.jobTitle || data.location) && (
        <Section title="Overview">
          {data.jobTitle && (
            <p className="font-body text-sm font-medium">{data.jobTitle}</p>
          )}
          <div className="font-body text-muted-foreground flex flex-wrap gap-x-3 text-xs">
            {data.companyName && <span>{data.companyName}</span>}
            {data.location && <span>{data.location}</span>}
            {data.locationType && (
              <Badge variant="outline" className="text-xs capitalize">
                {data.locationType}
              </Badge>
            )}
          </div>
        </Section>
      )}

      {/* Skills */}
      {(data.requiredSkills.length > 0 || data.preferredSkills.length > 0) && (
        <Section title="Skills">
          {data.requiredSkills.length > 0 && (
            <div className="space-y-1">
              <p className="font-body text-muted-foreground text-xs">
                Required
              </p>
              <div className="flex flex-wrap gap-1">
                {data.requiredSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {data.preferredSkills.length > 0 && (
            <div className="space-y-1">
              <p className="font-body text-muted-foreground text-xs">
                Preferred
              </p>
              <div className="flex flex-wrap gap-1">
                {data.preferredSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Salary */}
      {(data.salaryMin || data.salaryMax) && (
        <Section title="Salary">
          <p className="font-body text-sm">
            {data.salaryMin && data.salaryMax
              ? `${formatSalary(data.salaryMin)} - ${formatSalary(data.salaryMax)}`
              : data.salaryMin
                ? `From ${formatSalary(data.salaryMin)}`
                : `Up to ${formatSalary(data.salaryMax!)}`}
            {data.salaryCurrency && (
              <span className="text-muted-foreground">
                {' '}
                {data.salaryCurrency}
              </span>
            )}
          </p>
        </Section>
      )}

      {/* Experience + Education */}
      {(data.experienceYears !== undefined || data.educationRequired) && (
        <Section title="Requirements">
          <div className="font-body space-y-1 text-sm">
            {data.experienceYears !== undefined && (
              <p>
                <span className="text-muted-foreground">Experience:</span>{' '}
                {data.experienceYears}+ years
              </p>
            )}
            {data.educationRequired && (
              <p>
                <span className="text-muted-foreground">Education:</span>{' '}
                {data.educationRequired}
              </p>
            )}
          </div>
        </Section>
      )}

      {/* Responsibilities */}
      {data.responsibilities && data.responsibilities.length > 0 && (
        <Section title="Responsibilities">
          <ul className="font-body text-muted-foreground list-inside list-disc space-y-0.5 text-sm">
            {data.responsibilities.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Benefits */}
      {data.benefits && data.benefits.length > 0 && (
        <Section title="Benefits">
          <ul className="font-body text-muted-foreground list-inside list-disc space-y-0.5 text-sm">
            {data.benefits.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
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
      <h4 className="font-heading text-primary text-sm">{title}</h4>
      {children}
    </div>
  );
}

function formatSalary(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
}
