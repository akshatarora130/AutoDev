import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Textarea } from "../common/Textarea";
import { Select } from "../common/Select";
import { Modal } from "../common/Modal";
import type { CreateStoryParams } from "../../types";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: CreateStoryParams;
  onFormChange: (data: CreateStoryParams) => void;
  onSubmit: () => void;
}

export const CreateStoryModal = ({
  isOpen,
  onClose,
  formData,
  onFormChange,
  onSubmit,
}: CreateStoryModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Story">
      <div className="space-y-4">
        <Input
          label="Story Title"
          value={formData.title}
          onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
          placeholder="e.g. Add user authentication"
          required
        />
        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
          placeholder="Describe what needs to be implemented..."
          rows={4}
          required
        />
        <Select
          label="Priority"
          value={formData.priority || "medium"}
          onChange={(e) =>
            onFormChange({
              ...formData,
              priority: e.target.value as "low" | "medium" | "high" | "critical",
            })
          }
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
            { value: "critical", label: "Critical" },
          ]}
        />
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400">
            <strong>Coming Soon:</strong> Jira and Azure DevOps integration for importing stories
            directly from your project management tools.
          </p>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!formData.title || !formData.description}>
            Create Story
          </Button>
        </div>
      </div>
    </Modal>
  );
};
