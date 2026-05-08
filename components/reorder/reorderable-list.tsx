"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type RenderItemContext = {
  position: number;
};

type ReorderableListProps<T> = {
  emptyMessage?: string;
  getId: (item: T) => string;
  isSaving: boolean;
  items: T[];
  onSave: (orderedItems: T[]) => Promise<boolean>;
  renderItem: (item: T, context: RenderItemContext) => React.ReactNode;
  saveLabel?: string;
};

export function ReorderableList<T>({
  emptyMessage = "No hay elementos para ordenar.",
  getId,
  isSaving,
  items,
  onSave,
  renderItem,
  saveLabel = "Guardar orden",
}: ReorderableListProps<T>) {
  const [orderedItems, setOrderedItems] = useState(items);
  const [lastSavedItems, setLastSavedItems] = useState(items);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOrderedItems(items);
      setLastSavedItems(items);
    }, 0);
    return () => clearTimeout(timeout);
  }, [items]);

  const orderedIds = useMemo(() => orderedItems.map(getId), [getId, orderedItems]);
  const lastSavedIds = useMemo(() => lastSavedItems.map(getId), [getId, lastSavedItems]);
  const hasChanges = orderedIds.join("|") !== lastSavedIds.join("|");

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedItems.findIndex((item) => getId(item) === active.id);
    const newIndex = orderedItems.findIndex((item) => getId(item) === over.id);

    if (oldIndex >= 0 && newIndex >= 0) {
      setOrderedItems((current) => arrayMove(current, oldIndex, newIndex));
    }
  }

  async function handleSave() {
    const previousItems = lastSavedItems;
    const success = await onSave(orderedItems);

    if (success) {
      setLastSavedItems(orderedItems);
      return;
    }

    setOrderedItems(previousItems);
  }

  if (orderedItems.length === 0) {
    return (
      <Card className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">{orderedItems.length} elementos</p>
          <p className="text-sm text-muted-foreground">Arrastra las tarjetas para cambiar su posicion.</p>
        </div>
        <Button disabled={isSaving || !hasChanges} onClick={handleSave} type="button">
          <Save className={cn("h-4 w-4", isSaving && "animate-pulse")} />
          {isSaving ? "Guardando..." : saveLabel}
        </Button>
      </div>

      <Separator />

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {orderedItems.map((item, index) => (
              <SortableListCard id={getId(item)} key={getId(item)}>
                {renderItem(item, { position: index + 1 })}
              </SortableListCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableListCard({ children, id }: { children: React.ReactNode; id: string }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      className={cn("rounded-xl border bg-card p-4 shadow-sm", isDragging && "z-10 opacity-80 ring-2 ring-primary")}
      ref={setNodeRef}
      style={style}
    >
      <div className="flex items-center gap-3">
        <button
          aria-label="Arrastrar elemento"
          className="shrink-0 cursor-grab rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </Card>
  );
}
