import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingCardProps {
  className?: string;
  height?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  className = "", 
  height = "h-32" 
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
      </CardHeader>
      <CardContent>
        <div className={`bg-gray-200 rounded animate-pulse ${height}`}></div>
      </CardContent>
    </Card>
  );
};