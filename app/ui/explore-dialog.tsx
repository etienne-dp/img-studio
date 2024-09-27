import * as React from 'react'
import { useEffect, useState } from 'react'

import { Dialog, DialogContent, DialogTitle, IconButton, Slide, Box, Button, Typography } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { ArrowForwardIos, ArrowRight, Close, Download } from '@mui/icons-material'

import theme from '../theme'
import { ExportImageFormFields, ImageMetadataI } from '../api/export-utils'
import { CustomizedSendButton } from './components/Button-SX'
import { downloadImage } from '../api/cloud-storage/action'
const { palette } = theme

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export default function ExploreDialog({
  open,
  documentToExplore,
  handleImageExploreClose,
}: {
  open: boolean
  documentToExplore: ImageMetadataI | undefined
  handleImageExploreClose: () => void
}) {
  const [downloadStatus, setDownloadStatus] = useState('Download')

  const handleDownload = async (documentToExplore: ImageMetadataI) => {
    try {
      setDownloadStatus('Preparing download...')
      const res = await downloadImage(documentToExplore.imageGcsURI)
      const imageName = `${documentToExplore.imageID}.${documentToExplore.imageFormat.toLowerCase()}`
      downloadBase64Image(res.image, imageName)

      if (typeof res === 'object' && res['error']) {
        throw Error(res['error'].replaceAll('Error: ', ''))
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      setDownloadStatus('Download')
    }
  }

  const downloadBase64Image = (base64Data: any, filename: string) => {
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${base64Data}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog
      open={open}
      onClose={handleImageExploreClose}
      aria-describedby="parameter the export of an image"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'left',
          p: 1,
          cursor: 'pointer',
          height: '90%',
          maxWidth: '70%',
          width: '40%',
          borderRadius: 1,
          background: 'white',
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={handleImageExploreClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: palette.secondary.dark,
        }}
      >
        <Close sx={{ fontSize: '1.5rem', '&:hover': { color: palette.primary.main } }} />
      </IconButton>
      <DialogContent sx={{ m: 1 }}>
        <DialogTitle sx={{ p: 0, pb: 3 }}>
          <Typography
            sx={{
              fontSize: '1.7rem',
              color: palette.text.primary,
              fontWeight: 400,
              display: 'flex',
              alignContent: 'center',
            }}
          >
            {'Explore image metadata'}
          </Typography>
        </DialogTitle>
        <Box sx={{ pt: 1, pb: 2, width: '90%' }}>
          {documentToExplore &&
            Object.keys(ExportImageFormFields).map((key) => {
              const value = documentToExplore[key as keyof typeof documentToExplore]
              let displayValue = `${value}`

              const options = ExportImageFormFields[key as keyof typeof ExportImageFormFields].options
              if (options && Array.isArray(value)) {
                displayValue = value
                  .map((val) => {
                    const matchingOption = options.find((option) => option.value === val)
                    return matchingOption ? matchingOption.label : val
                  })
                  .join(', ')
              }

              const isExploreVisible = ExportImageFormFields[key as keyof typeof ExportImageFormFields].isExploreVisible
              if (displayValue !== '' && isExploreVisible) {
                return (
                  <Box key={key} display="flex" flexDirection="row">
                    <ArrowRight sx={{ color: palette.primary.main, fontSize: '1.2rem', p: 0, mt: 0.2 }} />
                    <Box sx={{ pb: 1 }}>
                      <Typography display="inline" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        {`${ExportImageFormFields[key as keyof typeof ExportImageFormFields]?.label.replace(
                          '?',
                          ''
                        )}: `}
                      </Typography>
                      <Typography display="inline" sx={{ fontSize: '0.9rem', color: palette.text.secondary }}>
                        {`${displayValue}`}
                      </Typography>
                    </Box>
                  </Box>
                )
              } else {
                return null
              }
            })}
        </Box>
        {documentToExplore && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              onClick={() => handleDownload(documentToExplore)}
              endIcon={<Download />}
              disabled={downloadStatus === 'Preparing download...'}
              sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
            >
              {downloadStatus}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
