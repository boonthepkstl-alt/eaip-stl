import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, Upload, Image as ImageIcon } from 'lucide-react';
import { Button, Card, Input, Select, Textarea, SectionCard, useToast } from '@/components/ui';
import { createAssetSchema, type CreateAssetFormValues } from '@/schemas/asset.schema';
import { assetAPI } from '@/services/asset';
import { masterdataAPI } from '@/services/masterdata';
import { AssetCategory, AssetLocation, Vendor } from '@/types/masterdata';
import { cn } from '@/lib/cn';

interface CreateAssetProps {
  onNavigate: (id: string) => void;
}

const steps = [
  { id: 1, label: 'Basic Info', description: 'Identity and classification', fields: ['assetTag', 'name', 'categoryId', 'locationId'] as const },
  { id: 2, label: 'Additional Details', description: 'Serial, vendor, and warranty', fields: ['description', 'serialNumber', 'vendorId', 'warrantyExpiryDate'] as const },
  { id: 3, label: 'Review', description: 'Confirm and create', fields: [] as const },
];

// FR-20..FR-22, FR-25..FR-28 (Asset Management) — real submit via assetAPI.create + zod
// validation (createAssetSchema), replacing Bolt's manual useState form. The "Financial
// Information" wizard step Bolt shipped is removed entirely per BOLT_BASE_MIGRATION_PLAN
// Phase D (out of MVP scope) — this wizard now has 3 steps instead of 4.
export function CreateAsset({ onNavigate }: CreateAssetProps) {
  const { push } = useToast();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssetFormValues>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      assetTag: '', name: '', categoryId: '', locationId: '',
      description: '', serialNumber: '', vendorId: '', warrantyExpiryDate: '',
    },
  });

  const values = watch();

  const [masterdataLoading, setMasterdataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([masterdataAPI.listCategories(), masterdataAPI.listLocations(), masterdataAPI.listVendors()])
      .then(([categoryResult, locationResult, vendorResult]) => {
        if (cancelled) return;
        setCategories(categoryResult);
        setLocations(locationResult);
        setVendors(vendorResult);
      })
      .catch((err) => {
        if (cancelled) return;
        push({ variant: 'error', title: 'Could not load categories/locations/vendors', message: err instanceof Error ? err.message : String(err) });
      })
      .finally(() => {
        if (!cancelled) setMasterdataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [push]);

  const next = async () => {
    const fields = steps[step - 1].fields;
    const valid = fields.length === 0 ? true : await trigger(fields as unknown as (keyof CreateAssetFormValues)[]);
    if (valid) setStep((s) => Math.min(steps.length, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (formValues: CreateAssetFormValues) => {
    const isDuplicate = await assetAPI.isDuplicateAssetTag(formValues.assetTag);
    if (isDuplicate) {
      setError('assetTag', { message: 'Asset Tag นี้ถูกใช้งานแล้ว กรุณาใช้ค่าอื่น' });
      setStep(1);
      return;
    }
    try {
      const created = await assetAPI.create({ ...formValues, status: 'active' });
      push({ variant: 'success', title: 'Asset created', message: `${created.name} has been registered.` });
      onNavigate('assets');
    } catch {
      push({ variant: 'error', title: 'Create failed', message: 'ไม่สามารถสร้าง Asset ได้ กรุณาลองใหม่อีกครั้ง' });
    }
  };

  const categoryName = categories.find((c) => c.id === values.categoryId)?.name ?? '—';
  const locationName = locations.find((l) => l.id === values.locationId)?.name ?? '—';
  const vendorName = vendors.find((v) => v.id === values.vendorId)?.name ?? '—';

  return (
    // A plain <div> rather than <form onSubmit>: the final step's submit button calls
    // handleSubmit(onSubmit) directly via onClick (see Navigation below). Using a real
    // <form> + type="submit" here raced with the async `next()` step transition — React
    // reuses the same DOM button node across the step<3/step===3 ternary, and if next()'s
    // `await trigger(...)` resolved fast enough to flip that node's type to "submit" before
    // the browser finished processing the click, a single "Continue" press could also submit
    // the form.
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Stepper */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center text-body font-medium transition-colors shrink-0',
                  step > s.id ? 'bg-success-500 text-white' : step === s.id ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-400',
                )}>
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <div className="text-center hidden sm:block">
                  <p className={cn('text-caption font-medium', step >= s.id ? 'text-surface-900' : 'text-surface-400')}>{s.label}</p>
                  <p className="text-caption text-surface-400 hidden md:block">{s.description}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-0.5 flex-1 mx-2 sm:mx-4 transition-colors', step > s.id ? 'bg-success-500' : 'bg-surface-200')} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Step content */}
      {step === 1 && (
        <SectionCard title="Basic Information" description="Enter the core details for this asset">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-lg border-2 border-dashed border-surface-300 flex items-center justify-center text-surface-400 bg-surface-50">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <Button type="button" variant="outline" size="sm" leftIcon={<Upload className="h-4 w-4" />}>Upload Photo</Button>
                <p className="text-caption text-surface-500 mt-1.5">PNG or JPG, max 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Asset Tag" placeholder="e.g. NB-0019" error={errors.assetTag?.message} {...register('assetTag')} />
              <Input label="Asset Name" placeholder="e.g. MacBook Pro 16" error={errors.name?.message} {...register('name')} />
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    label="Category"
                    error={errors.categoryId?.message}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={masterdataLoading}
                    options={[{ value: '', label: masterdataLoading ? 'Loading...' : 'Select category' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                )}
              />
              <Controller
                control={control}
                name="locationId"
                render={({ field }) => (
                  <Select
                    label="Location"
                    error={errors.locationId?.message}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={masterdataLoading}
                    options={[{ value: '', label: masterdataLoading ? 'Loading...' : 'Select location' }, ...locations.map((l) => ({ value: l.id, label: l.name }))]}
                  />
                )}
              />
            </div>
          </div>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title="Additional Details" description="Serial number, vendor, and warranty">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Serial Number" placeholder="e.g. C02XK1ABJGH" {...register('serialNumber')} />
            <Controller
              control={control}
              name="vendorId"
              render={({ field }) => (
                <Select
                  label="Vendor"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={masterdataLoading}
                  options={[{ value: '', label: masterdataLoading ? 'Loading...' : 'Select vendor' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]}
                />
              )}
            />
            <Input label="Warranty Expiry" type="date" helpText="Leave blank if no warranty" {...register('warrantyExpiryDate')} />
          </div>
          <div className="mt-4">
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Textarea label="Description" placeholder="Additional notes about this asset..." value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard title="Review & Confirm" description="Verify the details before creating the asset">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50 border border-brand-200">
              <div className="h-12 w-12 rounded-lg bg-white border border-brand-200 flex items-center justify-center text-brand-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-title font-semibold text-surface-900">{values.name || 'Untitled Asset'}</p>
                <p className="text-caption text-surface-500">{categoryName} · {values.assetTag || 'No tag'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <ReviewRow label="Location" value={locationName} />
              <ReviewRow label="Serial Number" value={values.serialNumber || '—'} />
              <ReviewRow label="Vendor" value={vendorName} />
              <ReviewRow label="Warranty Expiry" value={values.warrantyExpiryDate || '—'} />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-50 border border-surface-200">
              <Check className="h-4 w-4 text-success-600" />
              <p className="text-body text-surface-600">All required fields are complete. Click "Create Asset" to register.</p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={step === 1 ? () => onNavigate('assets') : back}>
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        {step < steps.length ? (
          <Button type="button" rightIcon={<ChevronRight className="h-4 w-4" />} onClick={next}>Continue</Button>
        ) : (
          <Button type="button" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>Create Asset</Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-caption text-surface-500">{label}</p>
      <p className="text-body font-medium text-surface-900">{value}</p>
    </div>
  );
}
