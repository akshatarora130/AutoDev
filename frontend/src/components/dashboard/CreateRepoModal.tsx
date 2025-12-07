import { Lock, Globe } from "lucide-react";
import { Button } from "../common/Button";
import { Checkbox } from "../common/Checkbox";
import { Input } from "../common/Input";
import { Textarea } from "../common/Textarea";
import { Modal } from "../common/Modal";
import type { CreateRepoParams } from "../../types";

interface CreateRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: CreateRepoParams;
  onFormChange: (data: CreateRepoParams) => void;
  onSubmit: () => void;
}

export const CreateRepoModal = ({
  isOpen,
  onClose,
  formData,
  onFormChange,
  onSubmit,
}: CreateRepoModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Repository">
      <div className="space-y-4">
        <Input
          label="Repository Name"
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          placeholder="e.g. agent-swarm-01"
        />
        <Textarea
          label="Description"
          value={formData.description || ""}
          onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
          placeholder="Brief description of your project..."
          rows={3}
        />
        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
          <Checkbox
            id="private"
            checked={formData.private || false}
            onChange={(e) => onFormChange({ ...formData, private: e.target.checked })}
          />
          <div className="flex-1">
            <label
              htmlFor="private"
              className="text-sm font-medium text-white cursor-pointer select-none"
            >
              Private Repository
            </label>
            <p className="text-xs text-text-muted">
              You choose who can see and commit to this repository.
            </p>
          </div>
          {formData.private ? (
            <Lock className="w-4 h-4 text-accent-secondary" />
          ) : (
            <Globe className="w-4 h-4 text-text-muted" />
          )}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Create Repository</Button>
        </div>
      </div>
    </Modal>
  );
};
