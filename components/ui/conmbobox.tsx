"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  onValueChange: (value: string) => void
  value?: string
  width?: string
  label?: string
  showLabel?: boolean
}

export function Combobox({
  options,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  onValueChange,
  value = "",
    width = "w-60",
  label,
  showLabel = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(value)

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === internalValue ? "" : currentValue
    setInternalValue(newValue)
    onValueChange(newValue)
    setOpen(false)
  }

  const selectedLabel = internalValue
    ? options.find((option) => option.value === internalValue)?.label
    : placeholder

  const comboboxContent = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", width)}
        >
          {selectedLabel}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", width)}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      internalValue === option.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  if (showLabel && label) {
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">{label}</span>
        {comboboxContent}
      </div>
    )
  }

  return comboboxContent
}

// Demo component
const frameworks: ComboboxOption[] = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
]

export function ComboboxDemo() {
  const [selectedFramework, setSelectedFramework] = React.useState<string>("")

  const handleFrameworkChange = (value: string) => {
    setSelectedFramework(value)
    console.log("Selected framework:", value)
  }

  return (
    <div className="space-y-2">
      <Combobox
        options={frameworks}
        placeholder="Select framework..."
        searchPlaceholder="Search framework..."
        onValueChange={handleFrameworkChange}
        value={selectedFramework}
      />
      {selectedFramework && (
        <p className="text-sm text-gray-600">
          You selected: <strong>{frameworks.find((f) => f.value === selectedFramework)?.label}</strong>
        </p>
      )}
    </div>
  )
}
