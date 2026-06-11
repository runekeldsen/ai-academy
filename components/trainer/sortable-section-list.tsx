'use client'

import { useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { SectionCard } from './section-card'
import { updateSectionOrder } from '@/actions/modules'

type Module = { id: string; title: string; description: string | null; published: boolean; sort_order: number; created_at: string }
type Section = { id: string; title: string; sort_order: number; created_at: string; academy_modules: Module[] }
type Learner = { id: string; first_name: string; last_name: string }
type Team = { id: string; name: string; learnerIds: string[] }

export function SortableSectionList({
  sections: initialSections,
  learners,
  teams,
  exclusionMap,
}: {
  sections: Section[]
  learners: Learner[]
  teams: Team[]
  exclusionMap: Record<string, string[]>
}) {
  const [sections, setSections] = useState(initialSections)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sections.findIndex(s => s.id === active.id)
    const newIndex = sections.findIndex(s => s.id === over.id)
    const reordered = arrayMove(sections, oldIndex, newIndex)
    setSections(reordered)
    await updateSectionOrder(reordered.map((s, i) => ({ id: s.id, sort_order: i })))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {sections.map(section => (
            <SectionCard
              key={section.id}
              section={section}
              learners={learners}
              teams={teams}
              exclusionMap={exclusionMap}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
