# 07 - Contract Generation

## Contract Templates

Two primary templates based on the uploaded contract PDFs:

### Template 1: Design & Development Project Contract
Used for: branding, ui_ux_design, web_development, full_service projects

Dynamic fields to fill:
- Contract date
- Client company name, address
- Project summary line: "You, CLIENT are hiring WODO for {services} of {project_name} at an estimated cost of {amount} + 18% GST" (or without GST for international)
- Section 1.1: Project Deliverables Summary (multi-line text area, user enters bullet points)
- Section 1.2: Payment Terms (e.g., "50% advance, 30% on design, 20% on launch")
- Project Timeline in working days
- Signing authority names and designations for both parties

### Template 2: SEO & Retainer Contract
Used for: seo, google_ads, social_media, gmb, content_marketing retainer projects

Dynamic fields:
- Contract date
- Client company name, address
- Summary: "hiring WODO for {services} of {client_name} at an estimated retainer cost of {amount} per month"
- Section 1.1: Deliverables (text area)
- Section 1.2: Payment Terms, Retainer Period, Ad Spend terms (if applicable)
- Minimum contract months
- Signing details

## Contract Form (`/contracts/new`)

1. Select client (dropdown)
2. Select project (dropdown, filtered by client)
3. Select template (Design/Dev or SEO Retainer)
4. Form auto-fills from client + project data
5. Edit deliverables in a rich text area (or bullet list editor)
6. Customize payment terms
7. Preview PDF
8. Save as draft or generate final PDF

## PDF Generation

Use @react-pdf/renderer to replicate the existing contract layout:

- WODO header with logo and tagline
- "PROJECT CONTRACT" title
- Date
- Summary section
- Numbered sections (1. Work and Payment, 2. Ownership, 3. General Conditions, etc.)
- Signature block at bottom with spaces for both parties
- Company stamp
- Footer with website

The contract body (sections 2-11) is mostly static boilerplate text. Store as constants. Only sections 1.1 and 1.2 are dynamic per contract.

## Contract Lifecycle

```
Draft -> Sent (email to client) -> Signed (client returns signed copy) -> Active -> Completed/Terminated
```

Store signed PDF uploads in Supabase Storage.

## Implementation Note

Contract PDF generation is complex. For v1, generate the contract data and store it, but the PDF template can be simplified. The full pixel-perfect replication of the Canva design can be iterated on. Focus on getting the data flow right first.
