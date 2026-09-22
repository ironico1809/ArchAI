package com.archai.modulo.generador.repositorio;

import com.archai.modulo.generador.entidad.GeneracionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio del historial de generaciones (CU-10...CU-14).
 */
@Repository
public interface GeneracionRepositorio extends JpaRepository<GeneracionEntity, String> {

    List<GeneracionEntity> findTop50ByOrderByFechaCreacionDesc();

    List<GeneracionEntity> findByTipoOrderByFechaCreacionDesc(String tipo);
}