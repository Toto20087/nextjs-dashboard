'use client';

import { SignIn } from '@clerk/clerk-react';
import { Card } from '@/components/ui/card';

export const SignInPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
            Trading System
          </h1>
          <p className="text-muted-foreground">
            Access your professional trading dashboard
          </p>
        </div>
        <Card className="p-6 trading-card">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-transparent shadow-none",
                headerTitle: "text-foreground",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton: "trading-button",
                formButtonPrimary: "trading-button bg-primary hover:bg-primary/90",
                formFieldInput: "bg-input border-border",
                footerActionLink: "text-primary hover:text-primary/90",
              },
            }}
            redirectUrl="/live-trading"
            fallbackRedirectUrl="/live-trading"
          />
        </Card>
      </div>
    </div>
  );
};