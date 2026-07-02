import { useState } from 'react'
import { useLabels } from '@/lib/LabelContext'
import { Task, Priority } from '@/lib/types'

export default function FilterBar({ onSearch, allTasks, onToggleLabel }: {
  onSearch: (queries: string[]) => void
  allTasks: Task[]
  onToggleLabel: (filteredTasks: Task[]) => void
}) {
  const { labelPool, tasksForLabel } = useLabels()
  const [query, setQuery] = useState('')
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false)
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([])
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  function filterTasksByLabel(labelIds: string[]) {
    let tasks: Task[] = [];

    for (let labelId of labelIds) {
      let associatedTasks = tasksForLabel(allTasks, labelId);
      associatedTasks.forEach(task => {
        if (!tasks.find(current => current.id == task.id)) {
          tasks.push(task);
        }
      });
    }

    return tasks;
  }

  function filterTasksByPriority(priority: Priority[]) {
    if (priority.length == 0) {
      return allTasks;
    }

    return allTasks.filter(task => priority.includes(task.priority));
  }

  const handleSearch = () => {
    const queries = query
      .split(',')
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
    onSearch(queries)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const toggleLabel = (labelId: string) => {
    let newSelectedLabelIds =
      selectedLabelIds.includes(labelId) ?
        selectedLabelIds.filter((id) => id !== labelId) :
        [...selectedLabelIds, labelId]

    setSelectedLabelIds(newSelectedLabelIds)

    let filteredTasks = filterTasksByLabel(newSelectedLabelIds);
    if (filteredTasks.length == 0) filteredTasks = allTasks;

    onToggleLabel(filteredTasks)
  }

  const togglePriority = (priority: Priority) => {
    let priorities = [...selectedPriorities, priority];
    if (selectedPriorities.includes(priority)) {
      priorities = selectedPriorities.filter(p => p !== priority);
    }

    setSelectedPriorities(priorities);

    let filteredTasks = filterTasksByPriority(priorities);
    if (filteredTasks.length == 0) filteredTasks = allTasks;

    onToggleLabel(filteredTasks)
  }

  return (
    <div className="w-full bg-[#161523] flex items-center justify-center gap-3 py-4 px-6">
      {/* Search bar */}
      <div className="flex items-center gap-2 flex-1 max-w-xl">
        <input
          type="text"
          placeholder="Search tasks... (comma separated)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-[#282740] text-[#AD9BBF] text-xs rounded-md border border-[#555673] px-3 py-2 focus:outline-none focus:border-[#A6445E] transition-colors placeholder-[#555673]"
        />
        <button
          onClick={handleSearch}
          className="px-3 py-2 text-xs font-medium text-white bg-[#A6445E] hover:bg-[#F25C5C] rounded-md transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </div>

      {/* Filter button */}
      <div className="flex relative gap-2">
        <button
          onClick={() => { setLabelDropdownOpen((o) => !o); setPriorityDropdownOpen(false); }}
          className="px-3 py-2 text-xs font-medium text-[#AD9BBF] bg-[#282740] border border-[#555673] hover:border-[#A6445E] rounded-md transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Label
          {selectedLabelIds.length > 0 && (
            <span className="text-[10px] bg-[#A6445E] text-white rounded-full px-1.5">
              {selectedLabelIds.length}
            </span>
          )}
        </button>

        {/* Label dropdown */}
        {labelDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 w-56 max-h-64 overflow-y-auto bg-[#282740] border border-[#555673] rounded-lg shadow-xl p-2 flex flex-col gap-1">
            {labelPool.length === 0 ? (
              <span className="text-[10px] text-[#555673] px-2 py-1.5">No labels yet</span>
            ) : (
              labelPool.map((label) => {
                const isSelected = selectedLabelIds.includes(label.id)
                return (
                  <button
                    key={label.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLabel(label.id)
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1a1a2e] transition-colors"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isSelected
                        ? 'bg-[#A6445E] border-[#A6445E]'
                        : 'border-[#555673]'
                        }`}
                    >
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div
                      className="w-1 h-6 rounded-full shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-xs text-[#AD9BBF] truncate">{label.name}</span>
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* Priority button */}
        <button
          onClick={() => { setPriorityDropdownOpen((o) => !o); setLabelDropdownOpen(false); }}
          className="px-3 py-2 text-xs font-medium text-[#AD9BBF] bg-[#282740] border border-red-500 hover:border-red-600 rounded-md transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Priority
          {selectedPriorities.length > 0 && (
            <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5">
              {selectedPriorities.length}
            </span>
          )}
        </button>

        {/* Priority dropdown */}
        {priorityDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 w-56 max-h-64 overflow-y-auto bg-[#282740] border border-red-500 rounded-lg shadow-xl p-2 flex flex-col gap-1">
            <button
              onClick={() => togglePriority('Low')}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1a1a2e] transition-colors"
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${selectedPriorities.includes('Low')
                  ? 'bg-red-500 border-red-500'
                  : 'border-[#555673]'
                  }`}
              >
                {selectedPriorities.includes('Low') && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-[#AD9BBF] truncate">Low</span>
            </button>
            <button
              onClick={() => togglePriority('Normal')}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1a1a2e] transition-colors"
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${selectedPriorities.includes('Normal')
                  ? 'bg-red-500 border-red-500'
                  : 'border-[#555673]'
                  }`}
              >
                {selectedPriorities.includes('Normal') && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-[#AD9BBF] truncate">Normal</span>
            </button>
            <button
              onClick={() => togglePriority('High')}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1a1a2e] transition-colors"
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${selectedPriorities.includes('High')
                  ? 'bg-red-500 border-red-500'
                  : 'border-[#555673]'
                  }`}
              >
                {selectedPriorities.includes('High') && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-[#AD9BBF] truncate">High</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
