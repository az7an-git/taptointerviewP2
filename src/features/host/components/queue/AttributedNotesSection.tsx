import { useState } from "react";
import { Edit2, Plus, MessageSquare, Check, X, Clock, User } from "lucide-react";
import { InterviewNote } from "@/types/job";
import { useAuth } from "@/context/AuthContext";
import { jobsApi } from "@/api/jobsApi";
import { toast } from "sonner";
import { Spinner } from "@/common/ui/Spinner";

interface AttributedNotesSectionProps {
    jobId: string;
    queueEntryId: string;
    notes: InterviewNote[];
    onNotesUpdated?: (updatedNotes: InterviewNote[]) => void;
    readOnly?: boolean;
}

export function AttributedNotesSection({
    jobId,
    queueEntryId,
    notes,
    onNotesUpdated,
    readOnly = false,
}: AttributedNotesSectionProps) {
    const { user } = useAuth();
    const [newNoteContent, setNewNoteContent] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Newest notes first
    const sortedNotes = [...(notes || [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const handleAddNote = async () => {
        if (!newNoteContent.trim() || !jobId || !queueEntryId) return;
        setIsAdding(true);
        try {
            const res = await jobsApi.addInterviewNote(jobId, queueEntryId, newNoteContent.trim());
            if (res.data) {
                toast.success("Note added!");
                setNewNoteContent("");
                if (onNotesUpdated) {
                    onNotesUpdated([res.data, ...notes]);
                }
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to add note.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleStartEdit = (note: InterviewNote) => {
        setEditingNoteId(note.id);
        setEditContent(note.content);
    };

    const handleSaveEdit = async (noteId: string) => {
        if (!editContent.trim() || !jobId) return;
        setIsSavingEdit(true);
        try {
            const res = await jobsApi.editInterviewNote(jobId, noteId, editContent.trim());
            if (res.data) {
                toast.success("Note updated!");
                setEditingNoteId(null);
                if (onNotesUpdated) {
                    const updated = notes.map((n) => (n.id === noteId ? res.data : n));
                    onNotesUpdated(updated);
                }
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to edit note.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const canEditNote = (note: InterviewNote): boolean => {
        if (readOnly) return false;
        if (!user) return false;
        if (user.role === "admin") return true;
        return note.author?.id === user.id;
    };

    const formatDate = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
            });
        } catch {
            return isoString;
        }
    };

    return (
        <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#FF512F]" />
                    Interview Notes ({notes?.length || 0})
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Non-deletable audit log</span>
            </div>

            {/* Add New Note input box (if not readOnly) */}
            {!readOnly && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Add an attributed interview note..."
                        rows={2}
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F]"
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleAddNote}
                            disabled={isAdding || !newNoteContent.trim()}
                            className="px-3 py-1.5 bg-[#FF512F] hover:bg-[#FF7A00] text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                            {isAdding ? <Spinner className="w-3 h-3 border-white" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>Add Note</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Notes Chronological List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {sortedNotes.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs font-medium bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        No interview notes recorded yet.
                    </div>
                ) : (
                    sortedNotes.map((note) => {
                        const isEditingThis = editingNoteId === note.id;
                        const authorName = note.author
                            ? `${note.author.first_name || ""} ${note.author.last_name || ""}`.trim() || "Team Member"
                            : "Interviewer";

                        return (
                            <div
                                key={note.id}
                                className="bg-white border border-gray-200/90 rounded-xl p-3.5 shadow-2xs hover:border-gray-300 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                                        <User className="w-3.5 h-3.5 text-gray-500" />
                                        <span>{authorName}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                                            <Clock className="w-3 h-3 text-gray-400" />
                                            {formatDate(note.created_at)}
                                        </span>
                                        {note.edited_at && (
                                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 rounded-md">
                                                edited {formatDate(note.edited_at)}
                                            </span>
                                        )}
                                        {canEditNote(note) && !isEditingThis && (
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(note)}
                                                className="text-gray-400 hover:text-[#FF512F] p-1 cursor-pointer transition-colors"
                                                title="Edit note"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isEditingThis ? (
                                    <div className="space-y-2 pt-1">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            rows={2}
                                            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#FF512F]"
                                        />
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditingNoteId(null)}
                                                className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5 inline mr-1" /> Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEdit(note.id)}
                                                disabled={isSavingEdit || !editContent.trim()}
                                                className="px-3 py-1 bg-[#FF512F] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                                            >
                                                {isSavingEdit ? <Spinner className="w-3 h-3 border-white" /> : <Check className="w-3.5 h-3.5" />} Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {note.content}
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
