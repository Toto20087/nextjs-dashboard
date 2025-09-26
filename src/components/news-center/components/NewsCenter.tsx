"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { NewsFeedTab } from "./tabs/NewsFeedTab";
import { SentimentAnalysisTab } from "./tabs/SentimentAnalysisTab";
import { TickersTab } from "./tabs/TickersTab";
import { AddNewsUrlModal } from "./modals/AddNewsUrlModal";

export const NewsCenter = () => {
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">News Center</h1>
          <p className="text-muted-foreground">
            AI-powered market intelligence and trading recommendations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsUrlModalOpen(true)} 
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add News URL
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Live Feed Active</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">News Feed</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="tickers">Tickers</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <NewsFeedTab />
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <SentimentAnalysisTab />
        </TabsContent>

        <TabsContent value="tickers" className="space-y-4">
          <TickersTab />
        </TabsContent>
      </Tabs>

      {/* Add News URL Modal */}
      <AddNewsUrlModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
      />
    </div>
  );
};