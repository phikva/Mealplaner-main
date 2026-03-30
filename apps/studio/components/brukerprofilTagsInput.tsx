"use client"

import {useEffect, useMemo, useState} from 'react'
import {useClient, set} from 'sanity'
import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'

type Option = {label: string; value: string}

type BrukerprofilDoc = {
  kostholdsbehov?: Array<{navn?: string; verdi?: string}>
  vanligeAllergier?: Array<{navn?: string}>
}

type Props = {
  value?: string[]
  onChange: (patch: unknown) => void
  schemaType: {
    options?: {
      source?: 'diet' | 'allergens'
      placeholder?: string
    }
  }
  readOnly?: boolean
}

export function BrukerprofilTagsInput(props: Props) {
  const {value = [], onChange, schemaType, readOnly} = props
  const source = schemaType.options?.source
  const placeholder = schemaType.options?.placeholder ?? 'Søk og legg til…'
  const client = useClient({apiVersion: '2024-01-01'})
  const [doc, setDoc] = useState<BrukerprofilDoc | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    client
      .fetch<BrukerprofilDoc | null>(
        `*[_type == "brukerprofil"][0]{kostholdsbehov[]{navn,verdi},vanligeAllergier[]{navn}}`,
      )
      .then((res) => {
        if (!cancelled) setDoc(res)
      })
      .catch(() => {
        if (!cancelled) setDoc(null)
      })

    return () => {
      cancelled = true
    }
  }, [client])

  const options: Option[] = useMemo(() => {
    if (!doc || !source) return []
    if (source === 'diet') {
      return (doc.kostholdsbehov ?? [])
        .map((o) => ({
          label: o.navn?.trim() || o.verdi?.trim() || '',
          value: o.verdi?.trim() || '',
        }))
        .filter((o) => o.value.length > 0 && o.label.length > 0)
    }
    return (doc.vanligeAllergier ?? [])
      .map((o) => ({
        label: o.navn?.trim() || '',
        value: o.navn?.trim() || '',
      }))
      .filter((o) => o.value.length > 0 && o.label.length > 0)
  }, [doc, source])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [options, query])

  const toggle = (v: string) => {
    if (readOnly) return
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v]
    onChange(set(next))
  }

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} border>
        <Stack space={3}>
          <Flex gap={2} align="center">
            <Box flex={1}>
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder={placeholder}
                readOnly={readOnly}
              />
            </Box>
            <Text size={1} muted>
              {value.length} valgt
            </Text>
          </Flex>

          {options.length === 0 ? (
            <Text size={1} muted>
              Ingen valg funnet i `brukerprofil`. Legg til alternativer der først.
            </Text>
          ) : (
            <Flex wrap="wrap" gap={2}>
              {filtered.slice(0, 40).map((o) => {
                const active = value.includes(o.value)
                return (
                  <Button
                    key={o.value}
                    mode={active ? 'default' : 'bleed'}
                    tone={active ? 'primary' : 'default'}
                    text={o.label}
                    onClick={() => toggle(o.value)}
                    disabled={readOnly}
                  />
                )
              })}
            </Flex>
          )}
        </Stack>
      </Card>
      <Text size={1} muted>
        Verdiene lagres som {source === 'diet' ? '`kostholdsbehov.verdi`' : '`vanligeAllergier.navn`'} fra `brukerprofil`.
      </Text>
    </Stack>
  )
}

