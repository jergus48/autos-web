export const metadata = { title: 'Privacy Policy - Swiftrix Outreach' };

export default function Privacy() {
  return (
    <div className="wrap" style={{ maxWidth: 760, lineHeight: 1.65 }}>
      <div className="nav"><div className="l"><img src="/swiftrix-s.png" alt="" />SWIFTRIX OUTREACH</div></div>
      <h1>Privacy Policy</h1>
      <p>Last updated: 7 October 2026</p>
      <p>Swiftrix Outreach (app.swiftrix.eu) is an internal tool operated by Swiftrix (swiftrix.eu). It is used by Swiftrix staff and by sales partners whom Swiftrix has approved to prepare and track outreach to companies. Nobody can use it without an account, and accounts are only created by Swiftrix or for applicants that Swiftrix has approved.</p>

      <h2>What we process</h2>
      <ul>
        <li>Staff and partner accounts: email address and a hashed password.</li>
        <li>Partner applications: see the section below.</li>
        <li>Company records: business name, business email, phone, website and country, entered by staff or imported from a spreadsheet.</li>
        <li>Call notes and outcomes logged by staff, and generated presentations and call scripts.</li>
        <li>Meetings: the contact email a staff member enters, the meeting time, the Google Meet link, and, if the meeting is transcribed, the transcript text.</li>
      </ul>

      <h2>Partner applications</h2>
      <p>People who want to work with Swiftrix as a sales partner can apply at app.swiftrix.eu/join. We store the email address, a hashed password (never the password itself), the experience the applicant describes and the time of the application. We use them only to decide on the application and, if it is approved, to create the applicant's account. The legal basis is taking steps at the applicant's request before entering into an agreement (GDPR Art. 6(1)(b)).</p>
      <p>An applicant cannot sign in or see any company data until Swiftrix approves the application. A rejected application is deleted immediately, and an application that is not decided within 6 months is deleted. To withdraw or delete an application earlier, email info@swiftrix.eu. Controller: Ignas Lūža (Swiftrix).</p>

      <h2>Google user data</h2>
      <p>An administrator can connect one Google account to the app. The app then uses Google APIs only to:</p>
      <ul>
        <li>create Google Calendar events with a Google Meet link and send the invitation to the contact a staff member entered;</li>
        <li>read the transcript of Meet meetings created through the app, so it can be shown on the company record.</li>
      </ul>
      <p>The app does not read any other calendar events, Drive files or emails. Google data is not sold, not used for advertising, and not used to train AI models. The app's use of information received from Google APIs follows the Google API Services User Data Policy, including the Limited Use requirements.</p>
      <p>Only an OAuth refresh token is stored for the connected account. It can be revoked at any time at myaccount.google.com/permissions or by removing the connection in the app.</p>

      <h2>Where data is stored and who sees it</h2>
      <p>Data is stored in a database hosted by Supabase and served through Vercel. It is visible only to signed-in Swiftrix staff and approved sales partners, who see the companies assigned to their country. Presentation links shared with a company contain only the presentation for that company. Text from company websites may be sent to an AI provider (OpenRouter) to write the personalised presentation and script; no staff passwords or Google data are sent.</p>

      <h2>Retention and deletion</h2>
      <p>Records are kept for as long as they are useful for outreach. A company, a meeting transcript or an account can be deleted by an administrator at any time. To ask for deletion of data about you or your company, email info@swiftrix.eu and we will remove it.</p>

      <h2>Contact</h2>
      <p>Swiftrix, info@swiftrix.eu, swiftrix.eu</p>
    </div>
  );
}
