'use client';

import { ClerkProvider } from '@clerk/nextjs';

/* Clerk's appearance API requires literal color strings — cannot reference
   CSS custom properties. Values below are copied from globals.css Cartographic
   Dark tokens; keep in sync manually if those tokens change. */
const darkVariables = {
  fontFamily: "'JetBrains Mono', monospace",
  colorPrimary: '#c8780a',       // --color-secondary / --color-amber
  colorTextOnPrimaryBackground: '#ffffff',  // white on amber = legible
  borderRadius: '0px',           // --radius-md
  colorBackground: '#0a1520',    // --color-bg-elevated
  colorInputBackground: '#0e1c28', // --color-bg-overlay
  colorInputText: '#dceaf6',     // --color-text-primary
  colorText: '#dceaf6',          // --color-text-primary
  colorTextSecondary: '#8fb2c8', // --color-text-secondary
};

const darkElements = {
  headerTitle: { color: '#dceaf6' },
  headerSubtitle: { color: '#8fb2c8' },
  formFieldLabel: { color: '#8fb2c8' },
  formFieldHintText: { color: '#5f849e' },
  formFieldInput: { backgroundColor: '#0e1c28', borderColor: '#1e3040', color: '#dceaf6' },
  dividerText: { color: '#5f849e' },
  dividerLine: { backgroundColor: '#1e3040' },
  socialButtonsBlockButton: { backgroundColor: '#0e1c28', borderColor: '#1e3040', color: '#dceaf6' },
  socialButtonsBlockButtonText: { color: '#dceaf6' },
  footerActionText: { color: '#8fb2c8' },
  footerActionLink: { color: '#e8940e' },
  footer: { color: '#5f849e' },
  identityPreviewText: { color: '#dceaf6' },
  identityPreviewEditButtonIcon: { color: '#8fb2c8' },
  otpCodeFieldInput: { backgroundColor: '#0e1c28', borderColor: '#1e3040', color: '#dceaf6' },
  userButtonPopoverCard: { backgroundColor: '#0a1520', borderColor: '#1e3040', boxShadow: '0 10px 24px rgba(0,0,0,0.7)' },
  userButtonPopoverMain: { backgroundColor: '#0a1520' },
  userButtonPopoverActions: { backgroundColor: '#0a1520' },
  userButtonPopoverActionButton: { color: '#dceaf6' },
  userButtonPopoverActionButtonText: { color: '#dceaf6' },
  userButtonPopoverActionButtonIcon: { color: '#8fb2c8' },
  userButtonPopoverCustomItemButton: { color: '#dceaf6' },
  userButtonPopoverCustomItemButtonText: { color: '#dceaf6' },
  userButtonPopoverCustomItemButtonIcon: { color: '#8fb2c8' },
  userPreviewMainIdentifier: { color: '#dceaf6' },
  userPreviewSecondaryIdentifier: { color: '#8fb2c8' },
  userButtonPopoverFooter: { borderColor: '#1e3040', backgroundColor: '#0a1520' },
  card: { backgroundColor: '#0a1520', borderColor: '#1e3040' },
  navbar: { backgroundColor: '#060c12', borderColor: '#1e3040' },
  navbarHeader: { color: '#dceaf6', opacity: 1 },
  navbarButtonIcon: { color: '#8fb2c8' },
  pageScrollBox: { backgroundColor: '#0a1520' },
  profileSectionTitle: { color: '#dceaf6', borderColor: '#1e3040' },
  profileSectionSubtitle: { color: '#8fb2c8' },
  profileSectionContent: { color: '#dceaf6' },
  profileSectionPrimaryButton: { color: '#c8780a' },
  profileSectionItem: { borderColor: '#1e3040' },
  accordionTriggerButton: { color: '#dceaf6' },
  badge: { display: 'none' },
  badgePrimary: { display: 'none' },
  tableHead: { color: '#8fb2c8' },
  paginationButton: { color: '#8fb2c8' },
  paginationButtonIcon: { color: '#8fb2c8' },
  activeDeviceIcon: { color: '#8fb2c8', filter: 'invert(1) brightness(0.6)' },
  activeDevice: { borderColor: '#1e3040', color: '#dceaf6' },
  activeDeviceListItem: { borderColor: '#1e3040', color: '#dceaf6' },
  activeDeviceBrowser: { color: '#8fb2c8' },
  activeDeviceIpAddress: { color: '#8fb2c8' },
  activeDeviceLastActive: { color: '#5f849e' },
  pageHeader: { color: '#dceaf6' },
  pageHeaderTitle: { color: '#dceaf6' },
  pageHeaderSubtitle: { color: '#8fb2c8' },
  profileSectionTitleText: { color: '#dceaf6' },
  formattedDate: { color: '#8fb2c8' },
  identityPreviewEditButton: { color: '#c8780a' },
};

const localization = {
  userProfile: {
    deletePage: {
      title: 'Delete account',
      messageLine1: 'Your account will be permanently deleted.',
      messageLine2: 'This action cannot be undone.',
      actionDescription: 'Type "Delete account" below to continue.',
      confirm: 'DELETE ACCOUNT',
    },
  },
};

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={localization}
      appearance={{
        variables: darkVariables,
        elements: darkElements,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
