import { ReactNode, useEffect, useRef } from 'react';
import styles from './Form.module.css';
import { FieldValues, FormProvider, SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';

interface IFormProps<T extends FieldValues> {
  fnSubmit?: (data: T) => void;
  action?: string;
  method?: string;
  methodsForm?: UseFormReturn<T, object>;
  mode?: 'action' | 'hookForm';
  children?: ReactNode;
}

export const Form = <T extends FieldValues>({
  fnSubmit,
  action,
  method,
  methodsForm,
  mode = 'action',
  children,
}: IFormProps<T>) => {
  const formRef = useRef<HTMLFormElement>(null);
  const methods = useForm<T>();
  const { handleSubmit } = methodsForm || methods;

  useEffect(() => {
    if (mode === 'action' && formRef.current) {
      formRef.current.submit();
    }
  }, [mode]);

  const onSubmit: SubmitHandler<T> = async (data: T) => {
    if (fnSubmit && mode === 'hookForm') {
      fnSubmit(data);
    }
  };

  return (
    <>
      <FormProvider {...(methodsForm || methods)}>
        <form
          ref={formRef}
          action={mode === 'action' ? action : undefined}
          method={mode === 'action' ? method : undefined}
          className={styles.form}
          onSubmit={mode === 'hookForm' ? handleSubmit(onSubmit) : undefined}
        >
          {children}
        </form>
      </FormProvider>
    </>
  );
};
