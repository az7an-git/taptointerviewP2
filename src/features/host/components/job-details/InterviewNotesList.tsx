import { useState } from "react";
import { Edit2 } from "lucide-react";
import { InterviewNote } from "@/types/job";
import { Spinner } from "@/common/ui/Spinner";

interface InterviewNotesListProps {
    notes: InterviewNote[];
    onAddNote: (content: string) => Promise<void>;
    onEditNote: (noteId: string, content: string) => Promise<void>;
}

export default function InterviewNotesList({
    notes,
    onAddNote,
    onEditNote,
}: InterviewNotesListProps) {
    const [newNoteContent, setNewNoteContent] = useState("");
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editNoteContent, setEditNoteContent] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!newNoteContent.trim()) return;
        setIsAdding(true);
        try {
            await onAddNote(newNoteContent.trim());
            setNewNoteContent("");
        } finally {
            setIsAdding(false);
        }
    };

    const handleEdit = async (noteId: string) => {
        if (!editNoteContent.trim()) return;
        setSavingNoteId(noteId);
        try {
            await onEditNote(noteId, editNoteContent.trim());
            setEditingNoteId(null);
            setEditNoteContent("");
        } finally {
            setSavingNoteId(null);
        }
    };

    return (
        <div className="space-y-3">
            {/* Add Note Input */}
            <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0 border border-gray-200 rounded-lg focus-within:border-[#FF512F] transition-colors overflow-hidden bg-white">
                    <textarea
                        placeholder="Add an interview note..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !isAdding) {
                                e.preventDefault();
                                handleAdd();
                            }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs focus:outline-none resize-none bg-transparent block"
                        disabled={isAdding}
                        rows={2}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    disabled={isAdding || !newNoteContent.trim()}
                    className="shrink-0 px-4 py-2 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white rounded-lg text-xs font-bold hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm min-w-[60px]"
                >
                    {isAdding ? (
                        <Spinner className="w-3.5 h-3.5 border-t-2 border-b-2 border-white" />
                    ) : (
                        "Add"
                    )}
                </button>
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-brand [scrollbar-gutter:stable]">
                {notes.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-3">
                        No interview notes yet.
                    </p>
                )}
                {notes.map((note) => (
                    <div
                        key={note.id}
                        className="bg-white p-3 rounded-lg border border-gray-150 text-xs space-y-1"
                    >
                        {editingNoteId === note.id ? (
                            <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0 border border-gray-300 rounded focus-within:border-[#FF512F] transition-colors overflow-hidden bg-white">
                                    <textarea
                                        value={editNoteContent}
                                        onChange={(e) => setEditNoteContent(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey && savingNoteId !== note.id) {
                                                e.preventDefault();
                                                handleEdit(note.id);
                                            }
                                        }}
                                        className="w-full px-2 py-1.5 text-xs focus:outline-none resize-none bg-transparent block"
                                        autoFocus
                                        rows={2}
                                        disabled={savingNoteId === note.id}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5 shrink-0 w-[60px]">
                                    <button
                                        onClick={() => handleEdit(note.id)}
                                        disabled={savingNoteId === note.id || !editNoteContent.trim() || editNoteContent === note.content}
                                        className="w-full flex items-center justify-center py-1 bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer disabled:opacity-50"
                                    >
                                        {savingNoteId === note.id ? (
                                            <Spinner className="w-3 h-3 border-t-2 border-b-2 border-white" />
                                        ) : (
                                            "Save"
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setEditingNoteId(null)}
                                        disabled={savingNoteId === note.id}
                                        className="w-full py-1 bg-gray-200 text-gray-700 rounded text-[11px] font-medium hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between text-[11px] text-gray-400">
                                    <span>
                                        By{" "}
                                        <strong className="text-gray-700">
                                            {note.author?.first_name} {note.author?.last_name}
                                        </strong>{" "}
                                        on {new Date(note.created_at).toLocaleDateString()}{" "}
                                        <span className="whitespace-nowrap">
                                            at {new Date(note.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        {note.edited_at && (
                                            <span className="ml-1 italic text-amber-600">(edited)</span>
                                        )}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setEditingNoteId(note.id);
                                            setEditNoteContent(note.content);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                                        title="Edit note"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <p className="text-gray-800 font-medium break-words whitespace-pre-wrap">
                                    {note.content}
                                </p>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
