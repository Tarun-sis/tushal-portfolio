import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowDown, ArrowLeft, ArrowUp, Copy, ExternalLink, Inbox, Loader2, LogOut, RefreshCw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { getSupabaseClient, supabaseConfigurationError } from '@/lib/supabase';

type EnquiryStatus = 'new' | 'read' | 'replied' | 'archived';
interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string;
  business_type: string;
  requirements: string;
  status: EnquiryStatus;
  created_at: string;
  updated_at: string | null;
}
interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  url: string;
  image_url: string;
  image_alt: string;
  image_note: string;
  sort_order: number;
  is_published: boolean;
}
type ProjectDraft = Omit<Project, 'id' | 'sort_order' | 'is_published'>;
const emptyDraft: ProjectDraft = {
  slug: '', name: '', description: '', url: '', image_url: '', image_alt: '', image_note: 'Original project preview',
};
const statusLabels: Record<EnquiryStatus, string> = {
  new: 'Unread',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
};

function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className="text-neon underline-offset-4 hover:underline">{children}</a>;
}

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'reset' | 'recovery'>('login');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('recovery');
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (!supabase) throw new Error('Authentication is not configured yet.');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('Confirm the administrator email before signing in.');
      }
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_portfolio_admin');
      if (adminError) throw adminError;
      if (isAdmin !== true) {
        await supabase.auth.signOut();
        throw new Error('This account is not authorized to access the portfolio admin.');
      }
      window.location.assign('/admin');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const requestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (!supabase) throw new Error('Authentication is not configured yet.');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw resetError;
      setMessage('If this address belongs to an administrator, a password recovery link has been sent.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not request password recovery.');
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (!supabase) throw new Error('Authentication is not configured yet.');
      if (newPassword.length < 12) throw new Error('Use a password with at least 12 characters.');
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setMode('login');
      setPassword('');
      setNewPassword('');
      setMessage('Password updated. Sign in with your new password.');
      await supabase.auth.signOut();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update the password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-16">
      <section className="card w-full max-w-md p-7 sm:p-9">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-mute hover:text-soft"><ArrowLeft className="h-4 w-4" />Back to portfolio</a>
        <div className="mt-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-neon/30 bg-neon/10 text-neon"><ShieldCheck className="h-5 w-5" /></span>
          <div><p className="eyebrow">Private area</p><h1 className="mt-1 text-2xl font-semibold">{mode === 'recovery' ? 'Set a new password' : mode === 'reset' ? 'Password recovery' : 'Administrator sign in'}</h1></div>
        </div>
        {!supabase && <p role="alert" className="mt-6 rounded-xl border border-[#f2b45c]/40 bg-[#f2b45c]/10 p-3 text-sm text-[#f5ce98]">{supabaseConfigurationError ? 'Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.' : 'Supabase is not configured. Set the public Supabase URL and anon key, then apply the database migration.'}</p>}
        <form onSubmit={mode === 'recovery' ? updatePassword : mode === 'reset' ? requestReset : signIn} className="mt-7 space-y-4">
          {mode !== 'recovery' && (
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-medium">Administrator email</label>
              <input id="admin-email" type="email" autoComplete="username" required className="field" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          )}
          {mode === 'recovery' ? (
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-medium">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={12} required className="field" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              <p className="mt-2 text-xs text-mute">Use at least 12 characters.</p>
            </div>
          ) : mode === 'login' ? (
            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-medium">Password</label>
              <input id="admin-password" type="password" autoComplete="current-password" required className="field" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
          ) : null}
          {error && <p role="alert" className="rounded-xl border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 p-3 text-sm text-[#ffb0b0]">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-neon/30 bg-neon/5 p-3 text-sm text-soft">{message}</p>}
          <button className="btn btn-primary w-full" type="submit" disabled={busy || !supabase}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {busy ? 'Please wait…' : mode === 'recovery' ? 'Update password' : mode === 'reset' ? 'Send recovery link' : 'Sign in'}
          </button>
        </form>
        {mode === 'login' && (
          <button type="button" className="mt-4 min-h-11 text-sm text-mute underline-offset-4 hover:text-neon hover:underline"
            onClick={() => { setMode('reset'); setMessage(''); setError(''); }}>
            Forgot password?
          </button>
        )}
        {mode === 'reset' && (
          <button type="button" className="mt-4 min-h-11 text-sm text-mute underline-offset-4 hover:text-neon hover:underline"
            onClick={() => { setMode('login'); setMessage(''); setError(''); }}>
            Return to sign in
          </button>
        )}
      </section>
    </main>
  );
}

export function AdminDashboard() {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'error'>('checking');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setAccess('error');
      setAuthError(supabaseConfigurationError ? 'Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.' : 'Supabase is not configured.');
      return;
    }
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (active) {
          setAccess('error');
          setAuthError(error.message);
        }
        return;
      }
      if (active) setSession(data.session);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session) {
      if (!session) setAccess('denied');
      return;
    }
    let active = true;
    setAccess('checking');
    void (async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(session.access_token);
        if (userError) throw userError;
        if (!user || !user.email_confirmed_at) {
          if (active) setAccess('denied');
          return;
        }
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_portfolio_admin');
        if (adminError) throw adminError;
        if (active) setAccess(isAdmin === true ? 'allowed' : 'denied');
      } catch (reason) {
        if (active) {
          setAccess('error');
          setAuthError(reason instanceof Error ? reason.message : 'Could not verify administrator access.');
        }
      }
    })();
    return () => { active = false; };
  }, [session, supabase]);

  if (access === 'checking') return <main className="grid min-h-screen place-items-center text-mute"><Loader2 className="h-6 w-6 animate-spin" aria-label="Checking administrator access" /></main>;
  if (access !== 'allowed' || !session) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <section className="card max-w-lg p-8">
          <h1 className="text-2xl font-semibold">Admin access required</h1>
          <p className="mt-3 text-sm leading-relaxed text-mute">{access === 'error' ? authError : 'This account is not authorized for the private admin area.'}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <AdminLink href="/login">Administrator sign in</AdminLink>
            <AdminLink href="/">Return to portfolio</AdminLink>
          </div>
        </section>
      </main>
    );
  }

  return <DashboardContent email={session.user.email ?? ''} />;
}

function DashboardContent({ email }: { email: string }) {
  const supabase = getSupabaseClient()!;
  const [tab, setTab] = useState<'overview' | 'enquiries' | 'projects'>('overview');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | EnquiryStatus>('all');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [enquiryResult, projectResult] = await Promise.all([
      supabase.from('enquiries').select('id,name,email,phone,subject,business_type,requirements,status,created_at,updated_at').order('created_at', { ascending: false }),
      supabase.from('projects').select('id,slug,name,description,url,image_url,image_alt,image_note,sort_order,is_published').order('sort_order', { ascending: true }),
    ]);
    if (enquiryResult.error || projectResult.error) {
      setError(enquiryResult.error?.message ?? projectResult.error?.message ?? 'Could not load admin data.');
    } else {
      setEnquiries((enquiryResult.data ?? []) as Enquiry[]);
      setProjects((projectResult.data ?? []) as Project[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({
    total: enquiries.length,
    new: enquiries.filter((item) => item.status === 'new').length,
    read: enquiries.filter((item) => item.status === 'read').length,
    replied: enquiries.filter((item) => item.status === 'replied').length,
    archived: enquiries.filter((item) => item.status === 'archived').length,
  }), [enquiries]);

  const visibleEnquiries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return enquiries.filter((item) => (filter === 'all' || item.status === filter)
      && (!needle || [item.name, item.email, item.subject, item.requirements].some((value) => value?.toLowerCase().includes(needle))));
  }, [enquiries, filter, search]);
  const activeEnquiry = enquiries.find((item) => item.id === selected) ?? null;

  const refresh = async () => { await load(); setNotice('Inbox and project list refreshed.'); };
  const updateStatus = async (item: Enquiry, status: EnquiryStatus) => {
    setError('');
    const { error: updateError } = await supabase.from('enquiries').update({ status, updated_at: new Date().toISOString() }).eq('id', item.id);
    if (updateError) { setError(`Could not update enquiry: ${updateError.message}`); return; }
    setEnquiries((current) => current.map((entry) => entry.id === item.id ? { ...entry, status } : entry));
    setNotice(`Enquiry marked ${statusLabels[status].toLowerCase()}.`);
  };
  const deleteEnquiry = async (item: Enquiry) => {
    if (!window.confirm(`Permanently delete the enquiry from ${item.name}? This cannot be undone.`)) return;
    const { error: deleteError } = await supabase.from('enquiries').delete().eq('id', item.id);
    if (deleteError) { setError(`Could not delete enquiry: ${deleteError.message}`); return; }
    setEnquiries((current) => current.filter((entry) => entry.id !== item.id));
    setSelected(null);
    setNotice('Enquiry permanently deleted.');
  };

  const editProject = (project: Project) => {
    setEditingId(project.id);
    setDraft({
      slug: project.slug, name: project.name, description: project.description, url: project.url,
      image_url: project.image_url, image_alt: project.image_alt, image_note: project.image_note,
    });
    setTab('projects');
  };
  const resetDraft = () => { setDraft(emptyDraft); setEditingId(null); };
  const saveProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) { setError('Use a lowercase URL slug with letters, numbers, and hyphens.'); return; }
    try {
      const projectUrl = new URL(draft.url);
      if (projectUrl.protocol !== 'https:') throw new Error('Project links must use HTTPS.');
      const imageIsLocal = draft.image_url.startsWith('/') && !draft.image_url.startsWith('//');
      if (!imageIsLocal && new URL(draft.image_url).protocol !== 'https:') throw new Error('Preview images must use HTTPS or a local absolute path.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Enter valid project and preview URLs.');
      return;
    }
    setSaving(true);
    const result = editingId
      ? await supabase.from('projects').update(draft).eq('id', editingId)
      : await supabase.from('projects').insert({ ...draft, sort_order: (projects.at(-1)?.sort_order ?? 0) + 1, is_published: false });
    setSaving(false);
    if (result.error) { setError(`Could not save project: ${result.error.message}`); return; }
    resetDraft();
    setNotice(editingId ? 'Project updated.' : 'Project added as unpublished.');
    await load();
  };
  const togglePublished = async (project: Project) => {
    const { error: updateError } = await supabase.from('projects').update({ is_published: !project.is_published }).eq('id', project.id);
    if (updateError) { setError(`Could not change publication status: ${updateError.message}`); return; }
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, is_published: !item.is_published } : item));
    setNotice(`${project.name} ${project.is_published ? 'unpublished' : 'published'}.`);
  };
  const reorderProject = async (project: Project, direction: -1 | 1) => {
    const index = projects.findIndex((item) => item.id === project.id);
    const other = projects[index + direction];
    if (!other) return;
    const sorted = [...projects];
    [sorted[index], sorted[index + direction]] = [sorted[index + direction], sorted[index]];
    setError('');
    for (const [position, item] of sorted.entries()) {
      const { error: updateError } = await supabase.from('projects').update({ sort_order: (position + 1) * 10 }).eq('id', item.id);
      if (updateError) {
        setError(`Project order could not be fully saved: ${updateError.message}`);
        await load();
        return;
      }
    }
    setProjects(sorted.map((item, position) => ({ ...item, sort_order: (position + 1) * 10 })));
    setNotice('Project order updated.');
  };
  const copyContact = async (item: Enquiry) => {
    try {
      await navigator.clipboard.writeText(item.email || item.phone || '');
      setNotice('Contact detail copied.');
    } catch {
      setError('Could not copy automatically. Select the contact detail and copy it manually.');
    }
  };
  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(`Could not sign out cleanly: ${signOutError.message}`);
    else window.location.assign('/login');
  };

  return (
    <main className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="container-x flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <div><a href="/" className="font-display text-lg font-bold">Tushal<span className="text-neon">.</span></a><p className="mt-0.5 text-xs text-mute">Private admin · {email}</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => void refresh()} className="btn btn-ghost min-h-10 px-4"><RefreshCw className="h-4 w-4" />Refresh</button>
            <button onClick={() => void signOut()} className="btn btn-ghost min-h-10 px-4"><LogOut className="h-4 w-4" />Sign out</button>
          </div>
        </div>
      </header>
      <div className="container-x py-10 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="eyebrow">Owner dashboard</p><h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Portfolio admin</h1></div>
          <nav className="flex gap-2" aria-label="Admin sections">
            {(['overview', 'enquiries', 'projects'] as const).map((item) => (
              <button key={item} onClick={() => setTab(item)} aria-current={tab === item ? 'page' : undefined}
                className={`min-h-11 rounded-full border px-4 text-sm capitalize transition ${tab === item ? 'border-neon bg-neon text-bg' : 'border-line text-mute hover:text-soft'}`}>{item}</button>
            ))}
          </nav>
        </div>
        {error && <p role="alert" className="mt-7 rounded-xl border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 p-4 text-sm text-[#ffb0b0]">{error}</p>}
        {notice && <p role="status" className="mt-7 rounded-xl border border-neon/30 bg-neon/5 p-4 text-sm text-soft">{notice}</p>}
        {loading ? <div className="grid min-h-64 place-items-center text-mute"><Loader2 className="h-6 w-6 animate-spin" aria-label="Loading admin data" /></div> : (
          <>
            {tab === 'overview' && (
              <section className="mt-9">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    ['Total enquiries', counts.total],
                    ['Unread', counts.new],
                    ['Read', counts.read],
                    ['Replied', counts.replied],
                    ['Archived', counts.archived],
                  ].map(([label, count]) => <div key={label} className="card p-5"><p className="text-sm text-mute">{label}</p><p className="mt-3 font-display text-4xl font-semibold">{count}</p></div>)}
                </div>
                <div className="mt-10 flex items-center justify-between"><h2 className="text-2xl font-semibold">Recent submissions</h2><button onClick={() => setTab('enquiries')} className="text-sm text-neon">Open inbox →</button></div>
                <div className="mt-4 divide-y divide-line rounded-2xl border border-line">
                  {enquiries.slice(0, 5).map((item) => <button key={item.id} onClick={() => { setSelected(item.id); setTab('enquiries'); }} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-white/[0.03]">
                    <span><span className="block font-medium">{item.name} · {item.subject}</span><span className="mt-1 block text-sm text-mute">{new Date(item.created_at).toLocaleString()}</span></span><StatusBadge status={item.status} />
                  </button>)}
                  {!enquiries.length && <p className="p-6 text-sm text-mute">No enquiries have been submitted.</p>}
                </div>
              </section>
            )}
            {tab === 'enquiries' && (
              <section className="mt-9 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
                <div className="min-w-0">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input className="field" aria-label="Search enquiries" placeholder="Search name, subject, email, message…" value={search} onChange={(event) => setSearch(event.target.value)} />
                    <select className="field sm:max-w-48" aria-label="Filter enquiries by status" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
                      <option value="all">All statuses</option><option value="new">Unread</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="mt-4 space-y-2">
                    {visibleEnquiries.map((item) => <button key={item.id} onClick={() => { setSelected(item.id); if (item.status === 'new') void updateStatus(item, 'read'); }}
                      className={`w-full rounded-2xl border p-4 text-left transition hover:border-neon/40 ${selected === item.id ? 'border-neon/50 bg-neon/[0.04]' : 'border-line bg-surface'}`}>
                      <span className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{item.name}</span><StatusBadge status={item.status} /></span>
                      <span className="mt-1 block truncate text-sm text-soft">{item.subject}</span>
                      <span className="mt-1 block text-xs text-mute">{new Date(item.created_at).toLocaleString()} · {item.email || item.phone || 'No contact detail'}</span>
                    </button>)}
                    {!visibleEnquiries.length && <p className="card p-6 text-sm text-mute">No enquiries match this filter.</p>}
                  </div>
                </div>
                <div className="card min-w-0 p-5 sm:p-6">
                  {activeEnquiry ? <EnquiryDetail item={activeEnquiry} onStatus={updateStatus} onDelete={deleteEnquiry} onCopy={copyContact} /> : <div className="py-12 text-center text-mute"><Inbox className="mx-auto h-8 w-8" /><p className="mt-3 text-sm">Select an enquiry to view its details.</p></div>}
                </div>
              </section>
            )}
            {tab === 'projects' && (
              <section className="mt-9 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.8fr)]">
                <div className="space-y-3">
                  {projects.map((project, index) => <article key={project.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <img src={project.image_url} alt="" className="aspect-video w-full rounded-xl object-cover sm:w-40" />
                    <div className="min-w-0 flex-1"><h2 className="font-semibold">{project.name}</h2><p className="mt-1 truncate text-sm text-mute">{project.url}</p><p className="mt-2 text-xs text-mute">{project.is_published ? 'Published' : 'Unpublished'} · order {project.sort_order}</p></div>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-ghost min-h-10 px-3" title="Move up" aria-label={`Move ${project.name} up`} disabled={index === 0} onClick={() => void reorderProject(project, -1)}><ArrowUp className="h-4 w-4" /></button>
                      <button className="btn btn-ghost min-h-10 px-3" title="Move down" aria-label={`Move ${project.name} down`} disabled={index === projects.length - 1} onClick={() => void reorderProject(project, 1)}><ArrowDown className="h-4 w-4" /></button>
                      <button className="btn btn-ghost min-h-10 px-3" onClick={() => editProject(project)}>Edit</button>
                      <button className={`btn min-h-10 px-3 ${project.is_published ? 'btn-ghost' : 'btn-primary'}`} onClick={() => void togglePublished(project)}>{project.is_published ? 'Unpublish' : 'Publish'}</button>
                    </div>
                  </article>)}
                  {!projects.length && <p className="card p-6 text-sm text-mute">No projects found. Add one using the form.</p>}
                </div>
                <form onSubmit={saveProject} className="card space-y-4 p-5 sm:p-6">
                  <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{editingId ? 'Edit project' : 'Add a project'}</h2>{editingId && <button type="button" className="text-sm text-mute hover:text-soft" onClick={resetDraft}>Cancel edit</button>}</div>
                  <ProjectField label="Name" required value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value, slug: editingId ? current.slug : value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} />
                  <ProjectField label="URL slug" required value={draft.slug} onChange={(value) => setDraft((current) => ({ ...current, slug: value }))} />
                  <ProjectField label="Description" required value={draft.description} onChange={(value) => setDraft((current) => ({ ...current, description: value }))} multiline />
                  <ProjectField label="Project URL (HTTPS)" required type="url" value={draft.url} onChange={(value) => setDraft((current) => ({ ...current, url: value }))} />
                  <ProjectField label="Preview image URL (HTTPS or /path)" required value={draft.image_url} onChange={(value) => setDraft((current) => ({ ...current, image_url: value }))} />
                  <ProjectField label="Preview image alt text" required value={draft.image_alt} onChange={(value) => setDraft((current) => ({ ...current, image_alt: value }))} />
                  <ProjectField label="Preview note" required value={draft.image_note} onChange={(value) => setDraft((current) => ({ ...current, image_note: value }))} />
                  <button className="btn btn-primary w-full" type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add unpublished project'}</button>
                </form>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: EnquiryStatus }) {
  const color = status === 'new' ? 'border-neon/40 text-neon' : status === 'replied' ? 'border-[#77d7a0]/40 text-[#9ce3b7]' : status === 'archived' ? 'border-line text-mute' : 'border-[#8abfff]/40 text-[#a8ceff]';
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] ${color}`}>{statusLabels[status]}</span>;
}

function EnquiryDetail({ item, onStatus, onDelete, onCopy }: {
  item: Enquiry;
  onStatus: (item: Enquiry, status: EnquiryStatus) => Promise<void>;
  onDelete: (item: Enquiry) => Promise<void>;
  onCopy: (item: Enquiry) => Promise<void>;
}) {
  const replyUrl = item.email
    ? `mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`
    : null;
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Enquiry</p><h2 className="mt-2 text-2xl font-semibold">{item.name}</h2></div><StatusBadge status={item.status} /></div>
      <p className="mt-3 text-sm text-mute">{new Date(item.created_at).toLocaleString()}</p>
      <dl className="mt-6 space-y-4 border-y border-line py-5 text-sm">
        <div><dt className="text-xs uppercase tracking-wider text-mute">Subject</dt><dd className="mt-1">{item.subject}</dd></div>
        <div><dt className="text-xs uppercase tracking-wider text-mute">Email / phone</dt><dd className="mt-1 break-all">{item.email || item.phone || 'Not provided'}</dd></div>
        <div><dt className="text-xs uppercase tracking-wider text-mute">Website type</dt><dd className="mt-1">{item.business_type}</dd></div>
        <div><dt className="text-xs uppercase tracking-wider text-mute">Message</dt><dd className="mt-2 whitespace-pre-wrap leading-relaxed text-soft">{item.requirements}</dd></div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        {replyUrl && <a href={replyUrl} className="btn btn-primary min-h-10 px-4"><ExternalLink className="h-4 w-4" />Reply by email</a>}
        <button className="btn btn-ghost min-h-10 px-4" onClick={() => void onCopy(item)}><Copy className="h-4 w-4" />Copy contact</button>
        <label className="sr-only" htmlFor="enquiry-status">Enquiry status</label>
        <select id="enquiry-status" className="field min-h-10 w-auto py-2" value={item.status} onChange={(event) => void onStatus(item, event.target.value as EnquiryStatus)}>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <button className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm text-[#ff9f9f] hover:text-[#ffc0c0]" onClick={() => void onDelete(item)}><Trash2 className="h-4 w-4" />Delete enquiry…</button>
    </div>
  );
}

function ProjectField({ label, value, onChange, required, type = 'text', multiline = false }: {
  label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; multiline?: boolean;
}) {
  const id = `project-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return <div><label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>{multiline
    ? <textarea id={id} required={required} maxLength={500} rows={3} className="field resize-y" value={value} onChange={(event) => onChange(event.target.value)} />
    : <input id={id} required={required} maxLength={300} type={type} className="field" value={value} onChange={(event) => onChange(event.target.value)} />}</div>;
}
