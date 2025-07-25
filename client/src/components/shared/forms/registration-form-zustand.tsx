import React, {
  Suspense,
  memo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  useRegistrationStore,
  type RegistrationFormData,
} from "@/stores/registration-store";
import { StayData } from "./stay-info-form";
import {
  validateForm,
  hasValidationErrors,
  type ValidationErrors,
} from "@/lib/form-validation";
import { createRegistrationSchema } from "@/lib/validation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/contexts/i18n-context";
import { RegistrationStepper } from "./registration-stepper";
import MultiDocumentCapture from "./multi-document-capture-new/multi-document-capture-new";
import { CountryPhoneInput } from "./country-phone-input";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";
import { CountrySelector } from "./country-selector";
import CountryAutocomplete from "./country-autocomplete";
import { ArrivalTimePicker } from "./arrival-time-picker";
import { BedSelectionMap } from "./bed-selection-map";
import { BookingConfirmation } from "./booking-confirmation";
import { BookingSuccess } from "./booking-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  Phone,
  CreditCard,
  Pencil,
  Coins,
  Info,
} from "lucide-react";
import { GENDER_OPTIONS, DOCUMENT_TYPES, PAYMENT_TYPES } from "@/lib/constants";
import { getCountryCode } from "@/lib/validation";

type BookingStep = "form" | "bed-selection" | "confirmation" | "success";

interface RegistrationFormProps {
  stayData: StayData;
  onBack: () => void;
  onSuccess: () => void;
}

const RegistrationFormZustand: React.FC<RegistrationFormProps> = memo(
  ({ stayData, onBack, onSuccess }) => {
    const { t } = useI18n();
    const {
      formData,
      isOcrProcessing,
      hasDocumentProcessed,
      selectedDocumentType,
      detectedCountryCode,
      phoneFormat,
      updateField,
      setOcrProcessing,
      setDocumentProcessed,
      setSelectedDocumentType,
      setDetectedCountryCode,
      setPhoneFormat,
      populateFromOCR,
    } = useRegistrationStore();

    const [currentStep, setCurrentStep] = useState<BookingStep>("form");
    const [bookingReference, setBookingReference] = useState<string>("");
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
      {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [ocrConfidence, setOcrConfidence] = useState(0);
    const [personalInfoCollapsed, setPersonalInfoCollapsed] = useState(false);
    const [addressInfoCollapsed, setAddressInfoCollapsed] = useState(false);
    const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set());
    const [selectedBedInfo, setSelectedBedInfo] = useState<{
      roomName: string;
      bedNumber: number;
      position: "top" | "bottom";
      bunkNumber: number;
    } | null>(null);
    const [fieldLocks, setFieldLocks] = useState<Record<string, boolean>>({});
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Set default document type based on browser language
    useEffect(() => {
      const browserLang =
        navigator.language || navigator.languages?.[0] || "en";
      const isSpanish = browserLang.toLowerCase().startsWith("es");
      const defaultDocType = isSpanish ? "NIF" : "Passport";

      if (!formData.documentType) {
        updateField("documentType", defaultDocType);
        setSelectedDocumentType(defaultDocType);
      }
    }, [formData.documentType, updateField, setSelectedDocumentType]);

    const toggleFieldLock = (fieldName: string) => {
      setFieldLocks((prev) => {
        const newLocks = {
          ...prev,
          [fieldName]: !prev[fieldName],
        };

        if (!prev[fieldName]) {
          setTimeout(() => {
            const inputEl = inputRefs.current[fieldName];
            if (inputEl) {
              inputEl.focus();
              inputEl.setSelectionRange(
                inputEl.value.length,
                inputEl.value.length,
              );
            }
          }, 100);
        }

        return newLocks;
      });
    };

    const isFieldReadOnly = (fieldName: string): boolean => {
      const fieldValue =
        formData[fieldName as keyof RegistrationFormData] || "";
      const hasSignificantValue = fieldValue.toString().length >= 3;
      const isUnlocked = fieldLocks[fieldName];
      return hasDocumentProcessed && hasSignificantValue && !isUnlocked;
    };

    const isFieldEmpty = (fieldName: string): boolean => {
      const fieldValue =
        formData[fieldName as keyof RegistrationFormData] || "";
      return fieldValue.toString().length < 3;
    };

    const getCardIcon = (confidence: number) => {
      return confidence >= 0.9 ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
      );
    };

    const shouldCollapseCard = (confidence: number): boolean => {
      return hasDocumentProcessed && confidence >= 0.9;
    };

    const handleFieldFocus = (fieldName: string) => {
      setFocusedFields((prev) => new Set(Array.from(prev).concat([fieldName])));
    };

    const handleDocumentTypeChange = (documentType: string) => {
      setSelectedDocumentType(documentType);
      updateField("documentType", documentType);

      if (documentType === "NIF" || documentType === "NIE") {
        setDetectedCountryCode("ESP");
        setPhoneFormat("+34");
        updateField("addressCountry", "Spain");
        updateField("nationality", "ESP");
      }
    };

    const handleDocumentProcessed = (result: any) => {
      setOcrProcessing(true);
      setShowValidation(false);
      setValidationErrors({});

      const { frontOCR: front, backOCR: back, documentType } = result;

      const confidences = [];
      if (front?.confidence) confidences.push(front.confidence);
      if (back?.confidence) confidences.push(back.confidence);
      const avgConfidence =
        confidences.length > 0
          ? confidences.reduce((a, b) => a + b, 0) / confidences.length
          : 0;
      setOcrConfidence(avgConfidence);

      if (front?.extractedData || back?.extractedData) {
        const data = { ...front?.extractedData, ...back?.extractedData };

        if (data.expiryDate) {
          const expiryDate = data.expiryDate.includes("/")
            ? new Date(data.expiryDate.split("/").reverse().join("-"))
            : new Date(data.expiryDate);

          if (expiryDate < new Date()) {
            toast({
              title: t("validation.document_expired"),
              description: t("validation.document_expired_desc"),
              variant: "destructive",
            });
            setOcrProcessing(false);
            return;
          }
        }

        populateFromOCR(data);

        const shouldCollapse = shouldCollapseCard(avgConfidence);
        setPersonalInfoCollapsed(shouldCollapse);
        setAddressInfoCollapsed(shouldCollapse);

        if (data.addressCountry) {
          const countryCode = getCountryCode(data.addressCountry);
          setDetectedCountryCode(countryCode);
        }

        if (data.documentType) {
          setSelectedDocumentType(data.documentType);
        }

        setDocumentProcessed(true);

        setTimeout(() => setOcrProcessing(false), 500);
      } else {
        setOcrProcessing(false);
      }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const schema = createRegistrationSchema(formData.documentType, detectedCountryCode);
      const errors = validateForm(formData, schema);
      setValidationErrors(errors);

      if (hasValidationErrors(errors)) {
        setShowValidation(true);
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.querySelector(
          `[name="${firstErrorField}"]`,
        );
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        toast({
          title: t("notifications.validation_error"),
          description:
            errors[firstErrorField as keyof ValidationErrors] ||
            t("registration.check_required_fields"),
          variant: "destructive",
        });
        return;
      }

      setCurrentStep("bed-selection");
    };

    const handleBedSelection = (bedId: number) => {
      updateField("selectedBedId", bedId.toString());
      setSelectedBedInfo({
        roomName:
          bedId < 200
            ? "Dormitorio A"
            : bedId < 300
              ? "Dormitorio B"
              : "Private Rooms",
        bedNumber: bedId % 100,
        position: bedId % 2 === 0 ? "bottom" : "top",
        bunkNumber: Math.floor((bedId % 100) / 2) + 1,
      });
    };

    const handleBedConfirmation = () => {
      setCurrentStep("confirmation");
    };

    const mutation = useMutation({
      mutationFn: async (finalData: RegistrationFormData) => {
        const requestData = {
          pilgrim: {
            firstName: finalData.firstName || "",
            lastName1: finalData.lastName1 || "",
            lastName2: finalData.lastName2 || "",
            documentNumber: finalData.documentNumber || "",
            documentType: finalData.documentType || "NIF",
            documentSupport: finalData.documentSupport || "",
            expiryDate: finalData.expiryDate || "",
            birthDate: finalData.birthDate || "",
            gender: finalData.gender || "",
            nationality: finalData.nationality || "",
            addressStreet: finalData.addressStreet || "",
            addressCity: finalData.addressCity || "",
            addressPostalCode: finalData.addressPostalCode || "",
            addressCountry: finalData.addressCountry || "",
            addressProvince: finalData.addressProvince || "",
            phone: finalData.phone || "",
            email: finalData.email || "",
          },
          booking: {
            checkInDate: stayData.checkInDate,
            checkOutDate: stayData.checkOutDate,
            numberOfPersons: stayData.guests || 1,
            numberOfNights: stayData.nights || 1,
            estimatedArrivalTime: finalData.estimatedArrivalTime || "15:00",
            selectedBedId: finalData.selectedBedId,
            notes: finalData.notes || "",
            totalAmount: ((stayData.nights || 1) * 15).toString(),
          },
          payment: {
            paymentType: finalData.paymentType || "efect",
            amount: ((stayData.nights || 1) * 15).toString(),
          },
        };

        const response = await apiRequest("POST", "/api/register", requestData);
        return response.json();
      },
      onMutate: () => setIsSubmitting(true),
      onSuccess: (data) => {
        setIsSubmitting(false);
        const reference = `ALB-${Date.now().toString().slice(-6)}`;
        setBookingReference(reference);
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({
          title: t("notifications.success"),
          description: t("registration.booking_confirmed"),
        });
        setCurrentStep("success");
      },
      onError: (error: any) => {
        setIsSubmitting(false);
        toast({
          title: t("notifications.error"),
          description: error?.message || t("registration.error_message"),
          variant: "destructive",
        });
      },
    });

    const handleFinalConfirmation = () => mutation.mutate(formData);
    const handleNewBooking = () => {
      setCurrentStep("form");
      setBookingReference("");
      setSelectedBedInfo(null);
      setValidationErrors({});
      setShowValidation(false);
      onSuccess();
    };

    const renderCurrentStep = () => {
      switch (currentStep) {
        case "form":
          return (
            <form onSubmit={handleFormSubmit} className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    {t("registration.document_type")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-2 block">
                        {t("registration.document_type")} *
                      </label>
                      <Select
                        value={formData.documentType || ""}
                        onValueChange={handleDocumentTypeChange}
                      >
                        <SelectTrigger
                          className={`${showValidation && validationErrors.documentType ? "border-red-500" : ""}`}
                        >
                          <SelectValue
                            placeholder={t("registration.select_document_type")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {t(type.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {showValidation && validationErrors.documentType && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.documentType}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium mb-1">
                        {t("registration.document_info_title")}
                      </p>
                      <p>{t("registration.document_info_text")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Suspense
                fallback={
                  <Alert>
                    <AlertDescription>
                      {t("loading.processing")}
                    </AlertDescription>
                  </Alert>
                }
              >
                <MultiDocumentCapture
                  onDocumentProcessed={handleDocumentProcessed}
                  onDocumentTypeChange={handleDocumentTypeChange}
                  selectedDocumentType={selectedDocumentType}
                />
              </Suspense>

              {hasDocumentProcessed && (
                <Alert className="border-green-500 bg-green-50">
                  <AlertDescription className="text-green-700">
                    {t("registration.ocr_success")}
                  </AlertDescription>
                </Alert>
              )}

              {hasDocumentProcessed && (
                <Collapsible
                  open={!personalInfoCollapsed}
                  onOpenChange={(open) => setPersonalInfoCollapsed(!open)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            {getCardIcon(ocrConfidence)}
                            {t("registration.personal_info")}
                          </div>
                          {personalInfoCollapsed ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronUp className="w-5 h-5" />
                          )}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <CustomInput
                            label={`${t("registration.first_name")} *`}
                            value={formData.firstName || ""}
                            onChange={(e) =>
                              updateField("firstName", e.target.value)
                            }
                            maxLength={50}
                            error={
                              showValidation
                                ? validationErrors.firstName
                                : undefined
                            }
                          />

                          <CustomInput
                            label={`${t("registration.last_name_1")} *`}
                            value={formData.lastName1 || ""}
                            onChange={(e) =>
                              updateField("lastName1", e.target.value)
                            }
                            maxLength={50}
                            error={
                              showValidation
                                ? validationErrors.lastName1
                                : undefined
                            }
                          />

                          <CustomInput
                            label={t("registration.last_name_2")}
                            value={formData.lastName2 || ""}
                            onChange={(e) =>
                              updateField("lastName2", e.target.value)
                            }
                            maxLength={50}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <CustomInput
                            type="date"
                            label={`${t("registration.birth_date")} *`}
                            value={formData.birthDate || ""}
                            onChange={(e) =>
                              updateField("birthDate", e.target.value)
                            }
                            error={
                              showValidation
                                ? validationErrors.birthDate
                                : undefined
                            }
                          />

                          <CustomSelect
                            label={`${t("registration.gender")} *`}
                            value={formData.gender || ""}
                            onValueChange={(value) =>
                              updateField("gender", value)
                            }
                            options={GENDER_OPTIONS.map((option) => ({
                              value: option.value,
                              label: t(option.label),
                            }))}
                            error={
                              showValidation
                                ? validationErrors.gender
                                : undefined
                            }
                          />

                          <CustomInput
                            label={`${t("registration.nationality")} *`}
                            value={formData.nationality || ""}
                            onChange={(e) =>
                              updateField("nationality", e.target.value)
                            }
                            maxLength={3}
                            error={
                              showValidation
                                ? validationErrors.nationality
                                : undefined
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <CustomInput
                            label={`${t("registration.document_number")} *`}
                            value={formData.documentNumber || ""}
                            onChange={(e) =>
                              updateField("documentNumber", e.target.value)
                            }
                            maxLength={20}
                            error={
                              showValidation
                                ? validationErrors.documentNumber
                                : undefined
                            }
                          />

                          <CustomInput
                            label={t("registration.document_support")}
                            value={formData.documentSupport || ""}
                            onChange={(e) =>
                              updateField("documentSupport", e.target.value)
                            }
                            maxLength={20}
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {hasDocumentProcessed && (
                <Collapsible
                  open={!addressInfoCollapsed}
                  onOpenChange={(open) => setAddressInfoCollapsed(!open)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-600" />
                            {getCardIcon(ocrConfidence)}
                            {t("registration.address_info")}
                          </div>
                          {addressInfoCollapsed ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronUp className="w-5 h-5" />
                          )}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="google-places-wrapper">
                            <label className="text-sm font-medium text-gray-900 mb-1 block">
                              {t("registration.address")} *
                            </label>
                            <div className="relative">
                              <GooglePlacesAutocomplete
                                value={formData.addressStreet || ""}
                                onChange={(value) => {
                                  console.log("Address changed:", value);
                                  updateField("addressStreet", value);
                                }}
                                onPlaceSelected={(place) => {
                                  console.log("Place selected:", place);

                                  if (!place) return;

                                  // Set the formatted address
                                  if (place.formatted_address) {
                                    updateField(
                                      "addressStreet",
                                      place.formatted_address,
                                    );
                                  }

                                  // Extract and populate address components
                                  if (place.address_components) {
                                    const components = place.address_components;

                                    // Helper function to find component by type
                                    const findComponent = (types: string[]) => {
                                      for (const type of types) {
                                        const component = components.find(
                                          (comp: any) => comp.types.includes(type),
                                        );
                                        if (component) return component;
                                      }
                                      return null;
                                    };

                                    // Extract street number and route for more specific address
                                    const streetNumber = findComponent([
                                      "street_number",
                                    ]);
                                    const route = findComponent(["route"]);
                                    if (streetNumber && route) {
                                      const streetAddress = `${streetNumber.long_name} ${route.long_name}`;
                                      updateField(
                                        "addressStreet",
                                        streetAddress,
                                      );
                                    }

                                    // Extract city (try multiple component types)
                                    const city = findComponent([
                                      "locality",
                                      "administrative_area_level_2",
                                      "sublocality",
                                      "sublocality_level_1",
                                    ]);
                                    if (city) {
                                      updateField(
                                        "addressCity",
                                        city.long_name,
                                      );
                                    }

                                    // Extract postal code
                                    const postalCode = findComponent([
                                      "postal_code",
                                    ]);
                                    if (postalCode) {
                                      updateField(
                                        "addressPostalCode",
                                        postalCode.long_name,
                                      );
                                    }

                                    // Extract province/state
                                    const province = findComponent([
                                      "administrative_area_level_1",
                                      "administrative_area_level_2",
                                    ]);
                                    if (province) {
                                      updateField(
                                        "addressProvince",
                                        province.long_name,
                                      );
                                    }

                                    // Extract country
                                    const country = findComponent(["country"]);
                                    if (country) {
                                      const countryName = country.long_name;
                                      const countryCode = country.short_name;

                                      updateField(
                                        "addressCountry",
                                        countryName,
                                      );
                                      setDetectedCountryCode(countryCode);

                                      // The CountryAutocomplete component will handle finding the matching
                                      // country and updating nationality/phone format through its useEffect
                                    }

                                    // Trigger animation for populated fields
                                    const fieldsToAnimate = [
                                      "addressCity",
                                      "addressPostalCode",
                                      "addressProvince",
                                      "addressCountry",
                                    ];
                                    fieldsToAnimate.forEach((field) => {
                                      const element = document.querySelector(
                                        `[name="${field}"]`,
                                      );
                                      if (element) {
                                        element.classList.add(
                                          "field-populated",
                                        );
                                        setTimeout(() => {
                                          element.classList.remove(
                                            "field-populated",
                                          );
                                        }, 1000);
                                      }
                                    });
                                  }

                                  // Show a success toast
                                  toast({
                                    title: t("notifications.address_populated"),
                                    description: t(
                                      "registration.address_fields_updated",
                                    ),
                                  });
                                }}
                                placeholder={t("registration.address")}
                                className={`google-places-input ${showValidation && validationErrors.addressStreet ? "border-red-500" : ""}`}
                              />
                              {/* Debug info - remove in production */}
                              {process.env.NODE_ENV === "development" && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Debug: {formData.addressStreet || "(empty)"}
                                </div>
                              )}
                            </div>
                            {showValidation &&
                              validationErrors.addressStreet && (
                                <p className="text-red-500 text-xs mt-1">
                                  {validationErrors.addressStreet}
                                </p>
                              )}
                            <p className="text-xs text-gray-500 mt-1 italic">
                              {t("registration.address_autocomplete_hint") ||
                                "Start typing and select an address to auto-fill city, postal code, and country"}
                            </p>
                          </div>

                          <CustomInput
                            label={`${t("registration.city")} *`}
                            value={formData.addressCity || ""}
                            onChange={(e) =>
                              updateField("addressCity", e.target.value)
                            }
                            maxLength={100}
                            error={
                              showValidation
                                ? validationErrors.addressCity
                                : undefined
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <CustomInput
                            label={t("registration.postal_code")}
                            value={formData.addressPostalCode || ""}
                            onChange={(e) =>
                              updateField("addressPostalCode", e.target.value)
                            }
                            maxLength={10}
                            readOnly={isFieldReadOnly("addressPostalCode")}
                            className={
                              isFieldReadOnly("addressPostalCode")
                                ? "bg-gray-50"
                                : ""
                            }
                          />

                          <CustomInput
                            label={t("registration.province")}
                            value={formData.addressProvince || ""}
                            onChange={(e) =>
                              updateField("addressProvince", e.target.value)
                            }
                            maxLength={100}
                            readOnly={isFieldReadOnly("addressProvince")}
                            className={
                              isFieldReadOnly("addressProvince")
                                ? "bg-gray-50"
                                : ""
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1">
                          <CountryAutocomplete
                            value={formData.addressCountry || ""}
                            onCountrySelect={(country) => {
                              updateField("addressCountry", country.name);
                              updateField("nationality", country.nationality);
                              setDetectedCountryCode(country.code);
                              setPhoneFormat(country.dialCode);
                            }}
                            placeholder={t("registration.select_country")}
                            error={
                              showValidation
                                ? validationErrors.addressCountry
                                : undefined
                            }
                            className={
                              isFieldReadOnly("addressCountry")
                                ? "bg-gray-50"
                                : ""
                            }
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {hasDocumentProcessed && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-orange-600" />
                      {t("registration.contact_info")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CountryPhoneInput
                      countryName={formData.addressCountry}
                      localPhone={formData.phone || ""}
                      onLocalPhoneChange={(phone) =>
                        updateField("phone", phone)
                      }
                      onCountryChange={(countryName) => {
                        updateField("addressCountry", countryName);
                        console.log("Country changed to:", countryName);
                      }}
                      label={t("registration.phone")}
                      required
                      placeholder={t("registration.phone_placeholder")}
                      error={
                        showValidation ? validationErrors.phone : undefined
                      }
                    />

                    <CustomInput
                      type="email"
                      label={`${t("registration.email")} *`}
                      value={formData.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                      maxLength={100}
                      error={
                        showValidation ? validationErrors.email : undefined
                      }
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    {t("registration.payment_info")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PaymentTypeSelector
                    selectedType={formData.paymentType}
                    onChange={(type) => updateField("paymentType", type)}
                    error={
                      showValidation ? validationErrors.paymentType : undefined
                    }
                    t={t}
                  />

                  <div className="text-sm text-gray-600">
                    <p>
                      {t("pricing.total")}: €
                      {((stayData.nights || 1) * 15).toFixed(2)}
                    </p>
                    <p>{t("pricing.payment_due")}</p>
                  </div>
                </CardContent>
              </Card>

              <ArrivalTimePicker
                checkInDate={stayData.checkInDate}
                value={formData.estimatedArrivalTime}
                onChange={(time) => updateField("estimatedArrivalTime", time)}
                error={
                  showValidation
                    ? validationErrors.estimatedArrivalTime
                    : undefined
                }
              />

              <Alert>
                <AlertDescription>
                  {t("registration.compliance_text")}
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1"
                >
                  {t("registration.back")}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#45c655] hover:bg-[#3bb048]"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? t("loading.submitting")
                    : t("registration.continue_to_bed_selection")}
                </Button>
              </div>
            </form>
          );

        case "bed-selection":
          return (
            <BedSelectionMap
              checkInDate={stayData.checkInDate}
              checkOutDate={stayData.checkOutDate}
              selectedBedId={formData.selectedBedId}
              onBedSelect={handleBedSelection}
              onConfirm={handleBedConfirmation}
              onBack={() => setCurrentStep("form")}
            />
          );

        case "confirmation":
          return (
            <BookingConfirmation
              formData={formData}
              stayData={stayData}
              bedInfo={selectedBedInfo || undefined}
              onConfirm={handleFinalConfirmation}
              onBack={() => setCurrentStep("bed-selection")}
              isSubmitting={isSubmitting}
            />
          );

        case "success":
          return (
            <BookingSuccess
              bookingReference={bookingReference}
              onNewBooking={handleNewBooking}
            />
          );

        default:
          return null;
      }
    };

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={onBack} className="text-white">
              &larr; {t("registration.back")}
            </Button>
            <h1 className="flex-1 text-center text-2xl font-bold text-white">
              {t("registration.title")}
            </h1>
          </div>

          <RegistrationStepper
            currentStep={
              currentStep === "form"
                ? 2
                : currentStep === "bed-selection"
                  ? 3
                  : currentStep === "confirmation"
                    ? 4
                    : 5
            }
          />

          {renderCurrentStep()}
        </div>
      </div>
    );
  },
);

RegistrationFormZustand.displayName = "RegistrationFormZustand";
export default RegistrationFormZustand;

// Helper components
interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div>
      {label && (
        <label className="text-sm font-medium text-gray-900 mb-1 block">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-red-500" : ""} ${className || ""}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  ),
);

interface CustomSelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}

const CustomSelect = ({
  label,
  value,
  onValueChange,
  options,
  error,
}: CustomSelectProps) => (
  <div>
    {label && (
      <label className="text-sm font-medium text-gray-900 mb-1 block">
        {label}
      </label>
    )}
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={error ? "border-red-500" : ""}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

interface PaymentTypeSelectorProps {
  selectedType?: string;
  onChange: (type: string) => void;
  error?: string;
  t: (key: string) => string;
}

// Replace the PaymentTypeSelector component with this complete version
const PaymentTypeSelector = ({
  selectedType,
  onChange,
  error,
  t,
}: PaymentTypeSelectorProps) => (
  <div>
    <label className="text-sm font-medium">
      {t("registration.payment_type")} *
    </label>
    <div className="grid grid-cols-2 gap-3 mt-2">
      <button
        type="button"
        onClick={() => onChange("tarjeta")}
        className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
          selectedType === "tarjeta"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        title="Pay with Visa or Mastercard credit/debit card"
      >
        <div className="flex space-x-1">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Former_Visa_%28company%29_logo.svg/330px-Former_Visa_%28company%29_logo.svg.png"
            alt="Visa"
            className="h-6 w-auto"
            title="Visa credit/debit cards accepted"
          />
          <img
            src="https://brand.mastercard.com/content/dam/mccom/brandcenter/thumbnails/mastercard_circles_92px_2x.png"
            alt="Mastercard"
            className="h-6 w-auto"
            title="Mastercard credit/debit cards accepted"
          />
        </div>
        <span className="text-sm font-medium">Credit Card</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("efect")}
        className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
          selectedType === "efect"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        title="Pay with cash at reception"
      >
        <div className="flex items-center gap-1">
          <Coins className="w-6 h-6" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-500 hover:text-blue-600" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Payment at reception. Reservation will only be held for one
                  additional hour past estimated arrival time. If amount is not
                  paid in full after that hour, automatic cancellation will be
                  issued.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-sm font-medium">Cash (at reception)</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("bizum")}
        className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
          selectedType === "bizum"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        title="Pay instantly with Bizum mobile payment"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/2/2b/Bizum.svg"
          alt="Bizum"
          className="h-6 w-auto"
          title="Bizum instant mobile payments"
        />
        <span className="text-sm font-medium">Bizum</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("transferencia")}
        className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
          selectedType === "transferencia"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        title="Pay via bank transfer or wire transfer"
      >
        <div className="flex items-center gap-1">
          <CreditCard className="w-6 h-6" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-500 hover:text-blue-600" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Payment at reception. Reservation will only be held for one
                  additional hour past estimated arrival time. If amount is not
                  paid in full after that hour, automatic cancellation will be
                  issued.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-sm font-medium">
          Bank Transfer (at reception)
        </span>
      </button>
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);
