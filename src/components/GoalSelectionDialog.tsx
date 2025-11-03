import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface GoalSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (goal: string, bodyParts: string[]) => void;
  currentGoal?: string;
}

export const GoalSelectionDialog = ({ open, onClose, onConfirm, currentGoal }: GoalSelectionDialogProps) => {
  const [goal, setGoal] = useState(currentGoal || "");
  const [bodyPartPreferences, setBodyPartPreferences] = useState<string[]>([]);

  const toggleBodyPart = (bodyPart: string) => {
    if (bodyPart === "corpo-todo") {
      setBodyPartPreferences(prev => 
        prev.includes("corpo-todo") ? [] : ["corpo-todo"]
      );
    } else {
      setBodyPartPreferences(prev => {
        const filtered = prev.filter(p => p !== "corpo-todo");
        if (filtered.includes(bodyPart)) {
          return filtered.filter(p => p !== bodyPart);
        }
        return [...filtered, bodyPart];
      });
    }
  };

  const bodyParts = [
    { id: "perna", label: "Perna" },
    { id: "peito", label: "Peito" },
    { id: "costas", label: "Costas" },
    { id: "ombro", label: "Ombro" },
    { id: "biceps", label: "Bíceps" },
    { id: "triceps", label: "Tríceps" },
    { id: "abdomen", label: "Abdômen" },
  ];

  const handleConfirm = () => {
    if (!goal) return;
    onConfirm(goal, bodyPartPreferences);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha o Foco do Novo Plano</DialogTitle>
          <DialogDescription>
            Selecione seu objetivo principal e as partes do corpo que deseja focar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="goal">Objetivo Principal</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hipertrofia">Hipertrofia (Ganhar Massa Muscular)</SelectItem>
                <SelectItem value="emagrecimento">Emagrecimento (Perder Peso)</SelectItem>
                <SelectItem value="saude">Saúde e Bem-estar</SelectItem>
                <SelectItem value="condicionamento">Condicionamento Físico</SelectItem>
                <SelectItem value="forca">Ganhar Força</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Foco nas Partes do Corpo (opcional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Selecione as partes do corpo que você quer focar mais
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-accent/5">
                <Checkbox
                  id="corpo-todo"
                  checked={bodyPartPreferences.includes("corpo-todo")}
                  onCheckedChange={() => toggleBodyPart("corpo-todo")}
                />
                <Label 
                  htmlFor="corpo-todo" 
                  className="font-semibold cursor-pointer"
                >
                  Corpo Todo (sem preferências específicas)
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {bodyParts.map(part => (
                  <div key={part.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={part.id}
                      checked={bodyPartPreferences.includes(part.id)}
                      onCheckedChange={() => toggleBodyPart(part.id)}
                      disabled={bodyPartPreferences.includes("corpo-todo")}
                    />
                    <Label 
                      htmlFor={part.id}
                      className="cursor-pointer"
                    >
                      {part.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!goal} className="flex-1">
            Gerar Novo Plano
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};