"use client"

import { useState, useEffect } from "react"
import {
  EDUCATIONAL_LEVELS,
  type EducationalLevelId,
  getGradeLabel,
} from "@/types/educational-levels"
import { GraduationCap } from "lucide-react"

interface EducationalLevelSelectorProps {
  defaultLevel?: EducationalLevelId
  defaultGrade?: string
  onChange: (level: EducationalLevelId, grade: string) => void
  compact?: boolean
}

export function EducationalLevelSelector({
  defaultLevel = "fundamental_1",
  defaultGrade = "1",
  onChange,
  compact = false,
}: EducationalLevelSelectorProps) {
  const [level, setLevel] = useState<EducationalLevelId>(defaultLevel)
  const [grade, setGrade] = useState(defaultGrade)

  useEffect(() => {
    // Ensure grade is valid for the selected level
    const validGrades = EDUCATIONAL_LEVELS[level].grades
    if (!validGrades.includes(grade)) {
      setGrade(validGrades[0])
      onChange(level, validGrades[0])
    }
  }, [level, grade, onChange])

  const handleLevelChange = (newLevel: EducationalLevelId) => {
    setLevel(newLevel)
    const firstGrade = EDUCATIONAL_LEVELS[newLevel].grades[0]
    setGrade(firstGrade)
    onChange(newLevel, firstGrade)
  }

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade)
    onChange(level, newGrade)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-gray-500" />
        <select
          value={level}
          onChange={(e) => handleLevelChange(e.target.value as EducationalLevelId)}
          className="text-sm border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {Object.values(EDUCATIONAL_LEVELS).map((l) => (
            <option key={l.id} value={l.id}>
              {l.displayName}
            </option>
          ))}
        </select>
        <select
          value={grade}
          onChange={(e) => handleGradeChange(e.target.value)}
          className="text-sm border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {EDUCATIONAL_LEVELS[level].grades.map((g) => (
            <option key={g} value={g}>
              {getGradeLabel(level, g)}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <GraduationCap className="w-4 h-4" />
        Nivel Educacional
      </div>

      {/* Level buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.values(EDUCATIONAL_LEVELS).map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => handleLevelChange(l.id as EducationalLevelId)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors
              ${
                level === l.id
                  ? "bg-amber-100 border-amber-400 text-amber-800"
                  : "bg-white border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50"
              }
            `}
          >
            {l.displayName}
          </button>
        ))}
      </div>

      {/* Grade buttons */}
      <div className="flex flex-wrap gap-2">
        {EDUCATIONAL_LEVELS[level].grades.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => handleGradeChange(g)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors
              ${
                grade === g
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"
              }
            `}
          >
            {getGradeLabel(level, g)}
          </button>
        ))}
      </div>

      {/* Age range info */}
      <p className="text-xs text-gray-500">
        Faixa etaria: {EDUCATIONAL_LEVELS[level].ageRange}
      </p>
    </div>
  )
}
