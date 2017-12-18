alter table dtl.promotions drop column platform;

delete from meta.migrations where id = '0054';
