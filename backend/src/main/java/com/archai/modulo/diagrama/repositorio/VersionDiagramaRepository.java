package com.archai.modulo.diagrama.repositorio;

import com.archai.modulo.diagrama.entidad.VersionDiagramaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VersionDiagramaRepository extends JpaRepository<VersionDiagramaEntity, String> {
    List<VersionDiagramaEntity> findByDiagramaIdOrderByNumeroVersionDesc(String diagramaId);
    Optional<VersionDiagramaEntity> findTopByDiagramaIdOrderByNumeroVersionDesc(String diagramaId);
}
