import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui";
import { Input } from "../ui";
import { useTranslation } from "../../i18n/useTranslation";

interface FolderNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  defaultValue?: string;
}

export function FolderNameDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  defaultValue = "",
}: FolderNameDialogProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('dialog.folderName.defaultTitle');
  const resolvedDescription = description ?? t('dialog.folderName.defaultDescription');
  const resolvedConfirmLabel = confirmLabel ?? t('dialog.folderName.defaultConfirm');
  const [name, setName] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(defaultValue);
      // Auto-focus with delay to ensure dialog is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, defaultValue]);

  const handleConfirm = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed) {
      onConfirm(trimmed);
    }
  }, [name, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
    },
    [handleConfirm],
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription className="-mt-1">
            {resolvedDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('dialog.folderName.placeholder')}
          className="mt-1"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>{t('dialog.folderName.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!name.trim()}>
            {resolvedConfirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
