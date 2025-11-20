import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface TemplateLoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplace: () => void;
  onMerge: () => void;
  onCancel: () => void;
}

export const TemplateLoadDialog = ({
  open,
  onOpenChange,
  onReplace,
  onMerge,
  onCancel,
}: TemplateLoadDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deseja substituir o treino atual?</AlertDialogTitle>
          <AlertDialogDescription>
            O template que você está prestes a carregar pode substituir ou mesclar com o treino atual. 
            Escolha uma opção:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <Button onClick={onMerge} variant="outline" className="sm:mr-auto">
            Mesclar com Treino Atual
          </Button>
          <AlertDialogAction onClick={onReplace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Substituir Treino Atual
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
