'use client';

import { FC, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import { Form } from '@/components/form/Form';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/button/Button';
import { useTranslation } from 'react-i18next';

interface IImageFieldProps {
  image: File | null;
  imagePreview?: string;
}

export const ImageField: FC = () => {
  const { t: translate } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);

  const methods = useForm<IImageFieldProps>({
    defaultValues: {
      image: null,
      imagePreview: '',
    },
  });

  const { control, setValue, watch, handleSubmit, setError, clearErrors } = methods;
  const watchedImage = watch('image');

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('image', { message: translate('pages.steps.selectImage') });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('image', { message: translate('pages.steps.notExceed') });
        return;
      }

      clearErrors('image');
      setValue('image', file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setValue('image', null);
      setPreview(null);
    }
  };

  const handleRemoveImage = () => {
    setValue('image', null);
    setPreview(null);
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const onSubmit = (data: IImageFieldProps) => {
    if (!data.image) {
      setError('image', { message: translate('pages.steps.requiredImage') });
      return;
    }

    const formData = new FormData();
    formData.append('image', data.image);
    //already to send image
  };

  return (
    <Box>
      <Typography color="text.secondary" sx={{ textAlign: 'center', marginBottom: '12px' }}>
        {translate('pages.steps.uploadImage')}
      </Typography>

      <Form<IImageFieldProps> methodsForm={methods} fnSubmit={onSubmit} mode="hookForm">
        <Box sx={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
          {preview ? (
            <Avatar
              src={preview}
              variant="rounded"
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Avatar
              variant="rounded"
              sx={{
                width: '100%',
                height: '100%',
                bgcolor: 'grey.300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PhotoCamera fontSize="large" color="disabled" />
            </Avatar>
          )}

          {preview && (
            <IconButton
              sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper' }}
              onClick={handleRemoveImage}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>

        <Controller
          name="image"
          control={control}
          render={() => (
            <Button
              startIcon={<PhotoCamera />}
              label={
                <>
                  {translate('actionButtons.select')}
                  <input
                    id="image-upload"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleFileChange(file);
                    }}
                  />
                </>
              }
            />
          )}
        />

        {watchedImage && (
          <Typography variant="body2" color="text.secondary">
            {translate('pages.steps.selectFile', { value: watchedImage.name })}
          </Typography>
        )}
        <Button variant="contained" type="submit" label={translate('actionButtons.save')} />
      </Form>
    </Box>
  );
};
