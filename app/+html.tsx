import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Inject Tailwind CSS variables and base styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              /* Base Colors - Light Mode */
              --background: 0 0% 100%;
              --foreground: 224 30% 15%;
              --card: 0 0% 100%;
              --card-foreground: 224 30% 15%;
              --popover: 0 0% 100%;
              --popover-foreground: 224 30% 15%;

              /* Primary - Medical Blue */
              --primary: 195 35% 47%;
              --primary-foreground: 0 0% 100%;

              /* Secondary - Wellness Green */
              --secondary: 105 34% 58%;
              --secondary-foreground: 0 0% 100%;

              /* Accent - Neutral Warm */
              --accent: 42 64% 86%;
              --accent-foreground: 210 10% 46%;

              /* Muted Colors */
              --muted: 42 64% 86%;
              --muted-foreground: 210 10% 46%;

              /* Destructive - Danger */
              --destructive: 0 58% 58%;
              --destructive-foreground: 0 0% 100%;

              /* UI Elements */
              --border: 220 20% 90%;
              --input: 220 20% 95%;
              --ring: 195 35% 47%;

              /* Status Colors - Light Mode */
              --success: 105 34% 58%;
              --success-foreground: 0 0% 100%;
              --warning: 38 70% 63%;
              --warning-foreground: 0 0% 100%;
              --info: 200 58% 65%;
              --info-foreground: 0 0% 100%;

              /* Surface Colors */
              --surface: 0 0% 100%;
              --surface-variant: 210 20% 96%;
              --surface-foreground: 224 30% 15%;

              /* Design System */
              --radius: 0.625rem;
            }

            .dark:root {
              /* Base Colors - Dark Mode */
              --background: 210 30% 8%;
              --foreground: 0 0% 98%;
              --card: 210 30% 10%;
              --card-foreground: 0 0% 98%;
              --popover: 210 30% 10%;
              --popover-foreground: 0 0% 98%;

              /* Primary - Medical Blue (Brighter for Dark Mode) */
              --primary: 195 45% 55%;
              --primary-foreground: 0 0% 98%;

              /* Secondary - Wellness Green (Brighter for Dark Mode) */
              --secondary: 105 40% 65%;
              --secondary-foreground: 0 0% 98%;

              /* Accent - Darker Neutral */
              --accent: 210 20% 18%;
              --accent-foreground: 0 0% 85%;

              /* Muted Colors */
              --muted: 210 20% 18%;
              --muted-foreground: 0 0% 75%;

              /* Destructive - Danger (Brighter for Dark Mode) */
              --destructive: 0 65% 65%;
              --destructive-foreground: 0 0% 98%;

              /* UI Elements */
              --border: 210 20% 25%;
              --input: 210 20% 22%;
              --ring: 195 45% 55%;

              /* Status Colors - Dark Mode */
              --success: 105 40% 65%;
              --success-foreground: 0 0% 98%;
              --warning: 38 75% 68%;
              --warning-foreground: 0 0% 98%;
              --info: 200 65% 70%;
              --info-foreground: 0 0% 98%;

              /* Surface Colors */
              --surface: 210 30% 10%;
              --surface-variant: 210 20% 15%;
              --surface-foreground: 0 0% 98%;
            }

            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
          `
        }} />

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
