'use client';

import { useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Settings, Palette, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { UserPreferences } from "./UserPreferences";

export const UserConfigDropdown = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { palette, setPalette } = useTheme();
  const [showPalette, setShowPalette] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const handlePaletteChange = (value: string) => {
    setPalette(value as 'default' | 'colorblind');
    setShowPalette(false);
  };

  const getUserRole = () => {
    // In a real app, this would come from user metadata or roles
    return "Admin";
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-start h-auto p-2 hover:bg-surface-elevated"
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.fullName || user.firstName || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium truncate">
                  {user.fullName || user.firstName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="start" side="right">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{user.fullName || user.firstName}</span>
                <Badge variant="secondary" className="text-xs">
                  {getUserRole()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-normal">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowPalette(true)}>
            <Palette className="mr-2 h-4 w-4" />
            <span>Color Palette</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPreferences(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Preferences</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => signOut()}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showPalette} onOpenChange={setShowPalette}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Color Palette</DialogTitle>
            <DialogDescription>
              Choose your preferred color palette for the interface.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={palette} onValueChange={handlePaletteChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="default" />
                <Label htmlFor="default">Default Palette</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="colorblind" id="colorblind" />
                <Label htmlFor="colorblind">Color Blind Friendly</Label>
              </div>
            </RadioGroup>
          </div>
        </DialogContent>
      </Dialog>

      <UserPreferences 
        open={showPreferences} 
        onOpenChange={setShowPreferences} 
      />
    </>
  );
};