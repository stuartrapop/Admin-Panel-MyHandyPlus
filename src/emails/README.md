# Email Templates

This folder contains React Email templates for MyHandyPlus.

## Structure

```
emails/
├── WelcomeEmail.tsx        # Welcome email template
├── emailUtils.tsx          # Helper functions for rendering templates
└── README.md              # This file
```

## Development

### Preview Templates

1. Navigate to **Email Templates** in the admin sidebar
2. Select a template from the dropdown
3. Edit the template data in the left panel
4. See the live preview in the center
5. Copy the HTML code from the bottom panel to use with Resend

### Create a New Template

1. Create a new file in this folder (e.g., `PasswordResetEmail.tsx`)
2. Use the `WelcomeEmail.tsx` as a reference
3. Import React Email components from `@react-email/components`
4. Export your template component
5. Add it to `emailUtils.tsx` in the `emailTemplates` object
6. Add it to the preview page in `pages/EmailPreview.tsx`

Example:

```tsx
import { Body, Container, Head, Heading, Html, Text } from "@react-email/components"

interface PasswordResetEmailProps {
  userName: string
  resetLink: string
}

export const PasswordResetEmail = ({ userName, resetLink }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Body>
      <Container>
        <Heading>Password Reset Request</Heading>
        <Text>Hi {userName},</Text>
        <Text>Click the link below to reset your password:</Text>
        <a href={resetLink}>Reset Password</a>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail
```

## Using Templates with Resend

### In a Supabase Edge Function

```typescript
import { Resend } from "resend"
import { renderEmailTemplate, emailSubjects } from "../emails/emailUtils"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

// Render the email
const html = await renderEmailTemplate("welcome", {
  userName: "John Doe",
  userEmail: "john@example.com"
})

// Send via Resend
await resend.emails.send({
  from: "MyHandyPlus <noreply@yourdomain.com>",
  to: "user@example.com",
  subject: emailSubjects.welcome,
  html: html
})
```

### In a Node.js API

```typescript
import { Resend } from "resend"
import { renderEmailTemplate, emailSubjects } from "./emails/emailUtils"

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendWelcomeEmail(user: User) {
  const html = await renderEmailTemplate("welcome", {
    userName: user.name,
    userEmail: user.email
  })

  await resend.emails.send({
    from: "MyHandyPlus <noreply@yourdomain.com>",
    to: user.email,
    subject: emailSubjects.welcome,
    html: html
  })
}
```

## Available Templates

### Welcome Email

- **File**: `WelcomeEmail.tsx`
- **Props**:
  - `userName`: User's first name
  - `userEmail`: User's email address
- **Use case**: Sent when a user signs up

## React Email Components

Available components from `@react-email/components`:

- `Html` - Root component
- `Head` - Email head
- `Body` - Email body
- `Container` - Centered container (max-width: 600px)
- `Section` - Content section
- `Row` / `Column` - Grid layout
- `Text` - Paragraph text
- `Heading` - Heading tags (h1-h6)
- `Button` - Call-to-action button
- `Link` - Hyperlink
- `Img` - Image
- `Hr` - Horizontal rule
- `Preview` - Preview text (shows in inbox)

## Styling

Use inline styles for maximum email client compatibility:

```tsx
const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px"
}

;<Text style={text}>Your content here</Text>
```

## Resources

- [React Email Documentation](https://react.email/docs/introduction)
- [Resend Documentation](https://resend.com/docs/introduction)
- [Email Client CSS Support](https://www.caniemail.com/)
