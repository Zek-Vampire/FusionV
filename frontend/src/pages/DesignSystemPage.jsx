import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Bookmark,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Download,
  Filter,
  FolderOpen,
  Heart,
  Info,
  Layers,
  Mail,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  Zap,
} from 'lucide-react';
import BlurText from '@/components/reactbits/BlurText';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button, { ButtonLink } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Checkbox, Input, SearchInput, Select, Switch, Textarea } from '@/components/ui/FormControls';
import Modal from '@/components/ui/Modal';
import { EmptyState, ErrorState, LoadingState, Skeleton } from '@/components/ui/States';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/context/ToastContext';
import { paths } from '@/routes/paths';

const COLORS = [
  { name: 'Graphite Black', hex: '#050706', token: '--color-background' },
  { name: 'Surface', hex: '#0D120F', token: '--color-surface' },
  { name: 'Elevated Surface', hex: '#141C17', token: '--color-elevated' },
  { name: 'Neon Lime', hex: '#75FF43', token: '--color-lime' },
  { name: 'Dark Lime', hex: '#42C91D', token: '--color-lime-dark' },
  { name: 'Cool Silver', hex: '#C7D0CA', token: '--color-silver' },
  { name: 'Primary Text', hex: '#F5F8F5', token: '--color-ink' },
  { name: 'Muted Text', hex: '#829087', token: '--color-muted' },
];

const TYPE_SCALE = [
  { label: 'Display', className: 'text-5xl font-bold tracking-tight', sample: 'FusionV' },
  { label: 'Heading 1', className: 'text-3xl font-bold tracking-tight', sample: 'Find your next team' },
  { label: 'Heading 2', className: 'text-2xl font-semibold tracking-tight', sample: 'Hackathons' },
  { label: 'Heading 3', className: 'text-lg font-semibold', sample: 'Card title' },
  { label: 'Body', className: 'text-base text-silver', sample: 'Supporting copy for the component preview.' },
  { label: 'Small', className: 'text-sm text-muted', sample: 'Secondary metadata and helper text.' },
  { label: 'Label', className: 'text-[11px] font-semibold uppercase tracking-[0.2em] text-muted', sample: 'Section label' },
];

const ICONS = [
  Menu, Search, Bell, Mail, User, Users, CalendarDays, FolderOpen, MessageSquare,
  Settings, Shield, Bookmark, Heart, Upload, Download, Filter, Plus, Check,
  ChevronRight, ArrowRight, Copy, Trash2, Layers, Sparkles, Zap, Info,
];

const SECTION_LINKS = [
  ['foundations', 'Foundations'],
  ['buttons', 'Buttons'],
  ['forms', 'Forms'],
  ['cards', 'Cards & badges'],
  ['overlays', 'Overlays'],
  ['tabs', 'Tabs'],
  ['states', 'States'],
  ['icons', 'Icons'],
  ['motion', 'Motion'],
];

function Section({ id, eyebrow, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lime">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Swatch({ name, hex, token }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="h-20 w-full border-b border-line" style={{ backgroundColor: hex }} />
      <div className="p-3">
        <p className="text-sm font-semibold text-ink">{name}</p>
        <p className="mt-0.5 font-mono text-xs text-silver">{hex}</p>
        <code className="mt-1 block truncate text-[11px] text-muted">{token}</code>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('member@example.com');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('student');
  const [checked, setChecked] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <p className="text-sm text-muted">
          Tab panel content for the selected tab. Panels are optional; the tab bar can be used on
          its own for page-level navigation.
        </p>
      ),
    },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      content: (
        <p className="text-sm text-muted">
          The active indicator animates with a shared layout transition, and arrow keys move focus
          between tabs.
        </p>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      content: (
        <p className="text-sm text-muted">
          Every tab is keyboard reachable: ArrowLeft, ArrowRight, Home and End are supported.
        </p>
      ),
    },
  ];

  return (
    <div className="pb-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <Badge variant="lime" dot>
            Phase 3 · Component gallery
          </Badge>
          <h1 className="text-gradient mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            FusionV design system
          </h1>
          <BlurText
            text="Graphite, neon lime and cool silver — one token set for every primitive, state and surface. This page is documentation, not application data."
            className="mt-4 max-w-2xl text-silver"
            animateBy="words"
            trigger="load"
            delay={40}
            stepDuration={0.38}
          />
        </div>
        <ButtonLink to={paths.home} variant="outline" iconRight={ArrowRight}>
          Foundation overview
        </ButtonLink>
      </div>

      <nav aria-label="Design system sections" className="mt-8 flex flex-wrap gap-2">
        {SECTION_LINKS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-silver transition-colors hover:border-lime/50 hover:text-lime"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-14">
        <Section
          id="foundations"
          eyebrow="Foundations"
          title="Tokens"
          description="Colour, type and elevation come from CSS custom properties declared in @theme, so every component consumes the same source of truth."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COLORS.map((color) => (
              <Swatch key={color.token} {...color} />
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Type scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {TYPE_SCALE.map((row) => (
                  <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line/60 pb-3 last:border-0 last:pb-0">
                    <span className={row.className}>{row.sample}</span>
                    <span className="text-[11px] uppercase tracking-wide text-muted">{row.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Radius</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-line bg-elevated text-xs text-muted">lg</div>
                  <div className="flex h-16 w-24 items-center justify-center rounded-xl border border-line bg-elevated text-xs text-muted">xl</div>
                  <div className="flex h-16 w-24 items-center justify-center rounded-panel border border-line bg-elevated text-xs text-muted">panel</div>
                </div>
              </Card>
              <Card className="p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Elevation</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-line bg-surface p-4 text-xs text-muted shadow-panel">Panel shadow</div>
                  <div className="rounded-xl border border-lime/25 bg-surface p-4 text-xs text-lime shadow-glow">Lime glow</div>
                </div>
              </Card>
            </div>
          </div>
        </Section>

        <Section
          id="buttons"
          eyebrow="Primitives"
          title="Buttons"
          description="One base control with semantic variants, four sizes, icon slots and a loading state that disables interaction."
        >
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="subtle">Subtle</Button>
              <Button variant="danger" icon={Trash2}>Delete</Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md" icon={Plus}>Medium</Button>
              <Button size="lg" iconRight={ArrowRight}>Large</Button>
              <Button size="icon" aria-label="Add item" icon={Plus} />
              <Button loading>Working…</Button>
              <Button disabled>Disabled</Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={() => toast({ title: 'Button pressed', description: 'The click handler is real.', variant: 'success' })}>
                Fire a toast
              </Button>
              <ButtonLink to={paths.designSystem} variant="outline">
                Button as a link
              </ButtonLink>
            </div>
          </Card>
        </Section>

        <Section
          id="forms"
          eyebrow="Primitives"
          title="Form controls"
          description="Labels, hints and errors are wired to the control through aria-describedby and aria-invalid. Nothing validates against a fake backend."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  hint="Used for the newsletter preview only."
                  autoComplete="email"
                />
                <Input
                  label="With an error"
                  defaultValue="not-an-email"
                  error="Enter a valid email address."
                />
                <Select label="Role" value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="student">Student</option>
                  <option value="organiser">Organiser</option>
                  <option value="mentor">Mentor</option>
                </Select>
                <Input label="Disabled" defaultValue="Unavailable" disabled />
                <Textarea
                  label="Bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="A short description…"
                  hint={`${bio.length}/280 characters`}
                  maxLength={280}
                  containerClassName="sm:col-span-2"
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-6">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  onSubmit={(value) => toast({ title: `Search submitted: ${value || '(empty)'}`, variant: 'info' })}
                  placeholder="Search components"
                  label="Search components"
                />
                <div className="flex flex-wrap gap-3">
                  {['Design', 'Engineering', 'Product'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setSearch(chip)}
                      className="rounded-full border border-line bg-elevated px-3 py-1.5 text-xs text-silver transition-colors hover:border-lime/50 hover:text-lime"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <Checkbox
                  label="Email me product updates"
                  description="The checkbox is a real control with a visible focus ring."
                  checked={checked}
                  onChange={(event) => setChecked(event.target.checked)}
                />
                <Switch
                  label="Notification preferences"
                  description="This switch is local state; no preference endpoint exists yet."
                  checked={notifications}
                  onChange={setNotifications}
                />
              </div>
            </Card>
          </div>
        </Section>

        <Section
          id="cards"
          eyebrow="Primitives"
          title="Cards, badges and avatars"
          description="Cards can use the React Bits spotlight surface; badges and avatars carry status and identity without relying on colour alone."
        >
          <Stagger className="grid gap-4 md:grid-cols-3">
            <StaggerItem>
              <Card interactive className="h-full">
                <CardHeader>
                  <div>
                    <CardTitle>Spotlight card</CardTitle>
                    <CardDescription>Pointer-tracked light on the React Bits surface.</CardDescription>
                  </div>
                  <Badge variant="lime">new</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted">
                    Move the pointer across the card, or tab into it: the spotlight also follows
                    keyboard focus.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline" iconRight={ArrowRight}>Open</Button>
                  <span className="text-xs text-muted">Elevation + glow</span>
                </CardFooter>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="h-full">
                <CardHeader>
                  <div>
                    <CardTitle>Standard card</CardTitle>
                    <CardDescription>Bordered surface for dense information.</CardDescription>
                  </div>
                  <Badge variant="neutral">default</Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="lime">lime</Badge>
                    <Badge variant="success" dot>success</Badge>
                    <Badge variant="warning" dot>warning</Badge>
                    <Badge variant="danger" dot>danger</Badge>
                    <Badge variant="outline">outline</Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Avatar name="Preview Member" size="sm" />
                  <span className="text-xs text-muted">Initials fallback</span>
                </CardFooter>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card interactive className="h-full">
                <CardContent className="flex h-full flex-col justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name="Preview Member" size="lg" />
                    <div>
                      <p className="text-sm font-semibold">Preview Member</p>
                      <p className="text-xs text-muted">member@example.com</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">Java</Badge>
                    <Badge variant="outline">PostgreSQL</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Primary</Button>
                    <Button size="sm" variant="ghost">Ghost</Button>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </Stagger>
        </Section>

        <Section
          id="overlays"
          eyebrow="Feedback"
          title="Modals, dialogs and toasts"
          description="Dialogs trap focus, close on Escape and restore focus to the trigger. Toasts live in a polite live region and pause when hovered."
        >
          <Card className="p-6">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setModalOpen(true)}>Open modal</Button>
              <Button variant="outline" onClick={() => setConfirmOpen(true)}>Open confirm dialog</Button>
              <Button variant="subtle" onClick={() => toast({ title: 'Saved', description: 'A success toast with auto-dismiss.', variant: 'success' })}>
                Success toast
              </Button>
              <Button variant="subtle" onClick={() => toast({ title: 'Check the form', description: 'An error toast is announced assertively.', variant: 'error' })}>
                Error toast
              </Button>
              <Button variant="subtle" onClick={() => toast({ title: 'Heads up', description: 'Warnings pause on hover.', variant: 'warning' })}>
                Warning toast
              </Button>
              <Button variant="ghost" onClick={() => toast({ title: 'Informational', description: 'Neutral toast for context.', variant: 'info', duration: 7000 })}>
                Info toast
              </Button>
            </div>
          </Card>

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Dialog example"
            description="Focus is trapped while this dialog is open."
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => { setModalOpen(false); toast({ title: 'Dialog confirmed', variant: 'success' }); }}>
                  Confirm
                </Button>
              </>
            }
          >
            <p className="text-sm text-muted">
              Dialog content sits here. Press Tab to cycle through the focusable elements, or
              Escape to close. The page behind cannot scroll.
            </p>
            <div className="mt-4 rounded-xl border border-line bg-elevated p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime/10 text-lime">
                  <Info size={17} aria-hidden="true" />
                </span>
                <p className="text-sm text-silver">Any content can be composed inside the dialog.</p>
              </div>
            </div>
          </Modal>

          <ConfirmDialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => { setConfirmOpen(false); toast({ title: 'Action confirmed', variant: 'success' }); }}
            title="Delete this item?"
            message="This is a demonstration of the confirmation pattern; no data is deleted."
            confirmLabel="Delete item"
          />
        </Section>

        <Section
          id="tabs"
          eyebrow="Navigation"
          title="Tabs and search"
          description="Tabs use roving tabindex and an animated indicator; the search field is a real form with a clear action."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <Tabs tabs={tabs} value={tab} onChange={setTab} aria-label="Component tabs" />
            </Card>
            <Card className="p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Search field</p>
              <SearchInput
                value={search}
                onChange={setSearch}
                onSubmit={(value) => toast({ title: `Search: ${value || '(empty)'}`, variant: 'info' })}
                placeholder="Search the design system"
                className="mt-3"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {['Loading', 'Empty', 'Error'].map((label) => (
                  <Badge key={label} variant="outline">{label} state</Badge>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        <Section
          id="states"
          eyebrow="Feedback"
          title="Loading, empty and error states"
          description="Every asynchronous surface has a designed state before it has data."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <LoadingState label="Loading component data…" />
            <EmptyState
              title="Nothing here yet"
              description="An empty state explains why the area is empty and what to do next."
              action={<Button size="sm" variant="outline" onClick={() => toast({ title: 'Empty-state action', variant: 'info' })}>Primary action</Button>}
            />
            <ErrorState
              title="Request failed"
              message="Error states surface the real message and offer a retry that is wired to the caller."
              onRetry={() => toast({ title: 'Retry requested', variant: 'warning' })}
            />
          </div>
          <Card className="mt-4 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Skeletons</p>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </Card>
        </Section>

        <Section
          id="icons"
          eyebrow="Foundation"
          title="Icons"
          description="Lucide icons, always paired with a label or an aria-label. Icons are decorative unless they carry meaning alone."
        >
          <Card className="p-5">
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-9 lg:grid-cols-12">
              {ICONS.map((Icon) => (
                <div key={Icon.displayName ?? Icon.name} className="flex aspect-square items-center justify-center rounded-lg border border-line bg-elevated text-silver">
                  <Icon size={18} aria-hidden="true" />
                </div>
              ))}
            </div>
          </Card>
        </Section>

        <Section
          id="motion"
          eyebrow="React Bits"
          title="Motion"
          description="Heavy but performant: transforms, opacity and filters only, with reduced-motion handling. Selected React Bits components are vendored in the design system."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card interactive className="p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Blur text</p>
              <BlurText
                text="Text resolves from a soft blur, one word at a time."
                className="mt-3 text-xl font-semibold text-ink"
                trigger="view"
                animateBy="words"
                delay={60}
              />
              <p className="mt-3 text-sm text-muted">
                React Bits BlurText, vendored with its original MotionConfig and screen-reader text.
              </p>
            </Card>

            <Card className="p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Click spark</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-lime">
                  <Sparkles size={20} aria-hidden="true" />
                </span>
                <p className="text-sm text-muted">
                  The global canvas effect is active across the app. Click anywhere outside this
                  card to see it; it is disabled under reduced motion.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">SpotlightCard</Badge>
                <Badge variant="outline">BlurText</Badge>
                <Badge variant="outline">ClickSpark</Badge>
                <Badge variant="outline">Motion</Badge>
              </div>
            </Card>
          </div>

          <Reveal className="mt-4">
            <Card className="p-6">
              <p className="text-sm text-muted">
                Scroll reveal and stagger are used for sections and card grids. Page transitions
                animate the route outlet. All of it collapses to a static layout when
                <code className="mx-1 rounded bg-elevated px-1.5 py-0.5 text-xs">prefers-reduced-motion</code>
                is set.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <ButtonLink to={paths.home} variant="outline" size="sm">Back to the overview</ButtonLink>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toast({ title: 'Toast from the motion section', variant: 'success' })}
                >
                  Test a toast here
                </Button>
                <Link to={paths.designSystem} className="inline-flex items-center gap-1 text-sm text-lime hover:text-lime-dark">
                  Replay this page <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </Card>
          </Reveal>
        </Section>
      </div>
    </div>
  );
}
