import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Chip,
  Button,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Avatar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productApi } from '../services/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import { formatCurrency } from '../utils/helpers';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface HistoryEntry {
  _id: string;
  action: 'created' | 'updated' | 'deleted';
  changes: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  performedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  changedAt: string;
}

const ProductHistory: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/products');
      return;
    }
    fetchHistory();
  }, [id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First get product details
      const productResponse = await productApi.get(`/products/${id}`);
      setProductName(productResponse.data.product.name);
      
      // Then get history
      const historyResponse = await productApi.get(`/products/${id}/history`);
      setHistory(historyResponse.data.history || []);
    } catch (error: any) {
      console.error('Error fetching history:', error);
      setError(error.response?.data?.error || t('history.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'success';
      case 'updated': return 'info';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  const getActionTranslation = (action: string) => {
    switch (action) {
      case 'created': return t('history.actions.create');
      case 'updated': return t('history.actions.update');
      case 'deleted': return t('history.actions.delete');
      default: return action;
    }
  };

  const formatFieldValue = (field: string, value: any) => {
    if (value === null || value === undefined) return '—';
    if (field === 'price') return formatCurrency(value);
    if (field === 'stock_quantity') return `${value} units`;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getFieldTranslation = (field: string) => {
    const fieldMap: Record<string, string> = {
      name: 'Name',
      description: 'Description',
      price: 'Price',
      category: 'Category',
      stock_quantity: 'Stock',
      designer: 'Designer',
      tags: 'Tags',
      images: 'Images',
      is_active: 'Status'
    };
    return fieldMap[field] || field;
  };

  const getUserName = (entry: HistoryEntry) => {
    if (entry.performedBy?.name) return entry.performedBy.name;
    if (entry.performedBy?.email) return entry.performedBy.email.split('@')[0];
    return 'System';
  };

  const getUserEmail = (entry: HistoryEntry) => {
    return entry.performedBy?.email || '';
  };

  const getUserInitials = (entry: HistoryEntry) => {
    const name = getUserName(entry);
    return name.charAt(0).toUpperCase();
  };

  const handleViewDetails = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')}>
          {t('common.back')}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        gap: 2,
        mb: 3 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/products')}
            variant="outlined"
            size="small"
          >
            {t('common.back')}
          </Button>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            {productName}
          </Typography>
        </Box>
        <Chip 
          label={`${history.length} ${history.length === 1 ? 'entry' : 'entries'}`}
          color="primary"
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Empty State */}
      {history.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('history.noHistory')}
        </Alert>
      ) : (
        /* History List */
        <Grid container spacing={2}>
          {history.map((entry) => (
            <Grid item xs={12} key={entry._id}>
              <Card elevation={1} sx={{ '&:hover': { boxShadow: 3 } }}>
                <CardContent>
                  <Grid container spacing={2}>
                    {/* Date & Time */}
                    <Grid item xs={12} sm={2.5}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('history.table.dateTime')}
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(entry.changedAt), 'MMM d, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                        {format(new Date(entry.changedAt), 'h:mm a')}
                      </Typography>
                    </Grid>
                    
                    {/* Action */}
                    <Grid item xs={12} sm={1.5}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('history.table.action')}
                      </Typography>
                      <Chip 
                        label={getActionTranslation(entry.action)} 
                        color={getActionColor(entry.action) as any}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    
                    {/* User */}
                    <Grid item xs={12} sm={2.5}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('history.table.user')}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                        <Avatar 
                          sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}
                        >
                          {getUserInitials(entry)}
                        </Avatar>
                        <Typography variant="body2" noWrap>
                          {getUserName(entry)}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Changes Summary */}
                    <Grid item xs={12} sm={3.5}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('history.table.changes')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {entry.changes?.length || 0} field{entry.changes?.length !== 1 ? 's' : ''} changed
                      </Typography>
                    </Grid>
                    
                    {/* Actions */}
                    <Grid item xs={12} sm={2}>
                      <Box display="flex" justifyContent="flex-end">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewDetails(entry)}
                        >
                          {t('common.details')}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'background.paper' }
        }}
      >
        <DialogTitle>
          Change Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedEntry && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Header Info */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip 
                  label={getActionTranslation(selectedEntry.action)} 
                  color={getActionColor(selectedEntry.action) as any}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(selectedEntry.changedAt), 'PPpp')}
                </Typography>
              </Box>

              <Divider />

              {/* User Info */}
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar 
                  sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                >
                  {getUserInitials(selectedEntry)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">
                    {getUserName(selectedEntry)}
                  </Typography>
                  {getUserEmail(selectedEntry) && (
                    <Typography variant="caption" color="text.secondary">
                      {getUserEmail(selectedEntry)}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Changes */}
              <Typography variant="subtitle2" gutterBottom>
                Changes Made:
              </Typography>
              
              {selectedEntry.changes?.length > 0 ? (
                selectedEntry.changes.map((change, idx) => (
                  <Box key={idx} sx={{ 
                    p: 1.5, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      {getFieldTranslation(change.field)}:
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {change.oldValue !== undefined && (
                        <Typography variant="body2" sx={{ color: 'error.main', textDecoration: 'line-through' }}>
                          {formatFieldValue(change.field, change.oldValue)}
                        </Typography>
                      )}
                      {change.newValue !== undefined && (
                        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                          {formatFieldValue(change.field, change.newValue)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  {t('history.noChanges')}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailsDialogOpen(false)} variant="outlined">
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductHistory;