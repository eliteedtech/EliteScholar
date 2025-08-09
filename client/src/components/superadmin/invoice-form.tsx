import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { SchoolWithDetails } from "@/lib/types";

const invoiceFormSchema = z.object({
  schoolId: z.string(),
  term: z.string().optional(),
  dueDate: z.string(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be positive"),
  })).min(1, "At least one line item is required"),
  sendEmail: z.boolean().default(false),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  school: SchoolWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvoiceForm({ school, onClose, onSuccess }: InvoiceFormProps) {
  const { toast } = useToast();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      schoolId: school.id,
      term: "",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      notes: "",
      lines: [
        {
          description: "Platform Subscription Fee",
          quantity: 1,
          unitPrice: 150000,
        },
      ],
      sendEmail: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => api.invoices.create(data),
    onSuccess: () => {
      toast({
        title: "Invoice created successfully",
        description: "The invoice has been created and email notification sent.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating invoice",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const generateTermInvoiceMutation = useMutation({
    mutationFn: (data: { schoolId: string; term: string }) => 
      api.invoices.generateTermInvoice(data),
    onSuccess: () => {
      toast({
        title: "Term invoice generated successfully",
        description: "The term invoice has been created and email notification sent.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error generating term invoice",
        description: error.message || "Failed to generate term invoice",
        variant: "destructive",
      });
    },
  });

  const addLineItem = () => {
    append({
      description: "",
      quantity: 1,
      unitPrice: 0,
    });
  };

  const removeLineItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const calculateSubtotal = () => {
    return form.watch("lines").reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.075; // 7.5% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const onSubmit = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const handleGenerateTermInvoice = () => {
    const term = form.getValues("term");
    if (!term) {
      toast({
        title: "Term required",
        description: "Please specify the term before generating invoice",
        variant: "destructive",
      });
      return;
    }

    generateTermInvoiceMutation.mutate({
      schoolId: school.id,
      term,
    });
  };

  const isSubmitting = createInvoiceMutation.isPending || generateTermInvoiceMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="invoice-form-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">Create Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for {school.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                value={school.name}
                disabled
                className="bg-slate-50"
                data-testid="input-school"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Term/Period</Label>
              <Select value={form.watch("term")} onValueChange={(value) => form.setValue("term", value)}>
                <SelectTrigger data-testid="select-term">
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first-term-2024">First Term 2024</SelectItem>
                  <SelectItem value="second-term-2024">Second Term 2024</SelectItem>
                  <SelectItem value="third-term-2024">Third Term 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate")}
                data-testid="input-due-date"
              />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-red-600">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                placeholder="Auto-generated"
                disabled
                className="bg-slate-50"
                data-testid="input-invoice-number"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-slate-900">Quick Actions</h4>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateTermInvoice}
                disabled={isSubmitting}
                data-testid="button-generate-term-invoice"
              >
                <i className="fas fa-magic mr-2"></i>
                Generate Term Invoice
              </Button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Generate a standard term invoice with default line items, or create a custom invoice below.
            </p>
          </div>

          {/* Invoice Items */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-lg font-medium text-slate-900 mb-4">Invoice Items</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 items-center text-sm font-medium text-slate-700">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-3">Unit Price (₦)</div>
                <div className="col-span-2 text-right">Total (₦)</div>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5">
                    <Input
                      placeholder="Platform Subscription Fee"
                      {...form.register(`lines.${index}.description`)}
                      data-testid={`input-line-description-${index}`}
                    />
                    {form.formState.errors.lines?.[index]?.description && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.lines[index]?.description?.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })}
                      data-testid={`input-line-quantity-${index}`}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...form.register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                      data-testid={`input-line-unit-price-${index}`}
                    />
                  </div>
                  <div className="col-span-1 text-right font-medium">
                    ₦{((form.watch(`lines.${index}.quantity`) || 0) * (form.watch(`lines.${index}.unitPrice`) || 0)).toLocaleString()}
                  </div>
                  <div className="col-span-1 text-center">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-800"
                        data-testid={`button-remove-line-${index}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                onClick={addLineItem}
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center space-x-2"
                data-testid="button-add-line"
              >
                <i className="fas fa-plus"></i>
                <span>Add Line Item</span>
              </Button>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="border-t border-slate-200 pt-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium" data-testid="subtotal">₦{calculateSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Tax (7.5%):</span>
                <span className="font-medium" data-testid="tax">₦{calculateTax().toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-900">Total:</span>
                <span className="text-lg font-bold text-slate-900" data-testid="total">₦{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for this invoice..."
              rows={3}
              {...form.register("notes")}
              data-testid="input-notes"
            />
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="sendEmail"
                checked={form.watch("sendEmail")}
                onCheckedChange={(checked) => form.setValue("sendEmail", !!checked)}
                data-testid="checkbox-send-email"
              />
              <Label htmlFor="sendEmail" className="text-sm font-medium text-slate-700">
                Send email notification to school
              </Label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="border-t border-slate-200 pt-6 flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-create-invoice"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create & Send Invoice"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
